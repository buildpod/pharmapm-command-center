/* ============================================================================
   File: src/services/settingsService.js
   Dependencies: PPM.services.projectService, PPM.services.editService,
                 PPM.events
   Exports: PPM.services.settingsService.{getSettings, setWorkingDays,
            addHoliday, removeHoliday, setTimezone}

   PURPOSE
   -------
   Wraps mutations to state.settings.* so the UI never touches state directly.
   Triggers full milestone cascade after a settings change because working-day
   and holiday changes can shift every date.
   ============================================================================ */

(function(){
  PPM.services = PPM.services || {};

  function getSettings(){
    var state = PPM.services.projectService.getState();
    if(!state) return null;
    // Return a shallow copy so callers can't mutate state directly
    return Object.assign({}, state.settings || {});
  }

  function _commit(state, recascade){
    state.updatedAt = PPM.domain.dates.nowISO();
    if(recascade){
      var result = PPM.domain.scheduling.cascade(
        state.milestones,
        state.settings.workingDays,
        state.settings.holidays
      );
      if(!result.error){
        state.milestones = result.milestones;
      }
    }
    PPM.events.emit('settings:changed', state.settings);
    PPM.events.emit('state:changed', state);
    PPM.services.editService.forceSave();
  }

  // workingDays: array of integers 0..6 (Sun=0, Sat=6).
  // Validates input and rejects empty list (must have at least one working day).
  function setWorkingDays(workingDays){
    var state = PPM.services.projectService.getState();
    if(!state) return { ok:false, error:'No project loaded' };
    if(!Array.isArray(workingDays) || workingDays.length === 0){
      return { ok:false, error:'At least one working day is required' };
    }
    var valid = workingDays.every(function(d){ return Number.isInteger(d) && d >= 0 && d <= 6; });
    if(!valid) return { ok:false, error:'Working days must be integers 0..6' };
    // Dedupe and sort for stable serialization
    var unique = workingDays.filter(function(d, i){ return workingDays.indexOf(d) === i; }).sort();
    state.settings.workingDays = unique;
    _commit(state, true);
    return { ok:true, workingDays: unique };
  }

  // Adds a holiday ISO date string. No-op if already present.
  function addHoliday(isoDate){
    var state = PPM.services.projectService.getState();
    if(!state) return { ok:false, error:'No project loaded' };
    if(!PPM.domain.dates.isValidISO(isoDate)){
      return { ok:false, error:'Invalid date format — expected YYYY-MM-DD' };
    }
    state.settings.holidays = state.settings.holidays || [];
    if(state.settings.holidays.indexOf(isoDate) >= 0){
      return { ok:true, holidays: state.settings.holidays.slice(), duplicate: true };
    }
    state.settings.holidays.push(isoDate);
    state.settings.holidays.sort();
    _commit(state, true);
    return { ok:true, holidays: state.settings.holidays.slice() };
  }

  function removeHoliday(isoDate){
    var state = PPM.services.projectService.getState();
    if(!state) return { ok:false, error:'No project loaded' };
    state.settings.holidays = state.settings.holidays || [];
    var idx = state.settings.holidays.indexOf(isoDate);
    if(idx < 0) return { ok:true, holidays: state.settings.holidays.slice(), notFound: true };
    state.settings.holidays.splice(idx, 1);
    _commit(state, true);
    return { ok:true, holidays: state.settings.holidays.slice() };
  }

  function setTimezone(tz){
    var state = PPM.services.projectService.getState();
    if(!state) return { ok:false, error:'No project loaded' };
    if(typeof tz !== 'string' || !tz) return { ok:false, error:'Invalid timezone' };
    state.settings.timezone = tz;
    _commit(state, false); // timezone change doesn't shift dates
    return { ok:true, timezone: tz };
  }

  PPM.services.settingsService = Object.freeze({
    getSettings:    getSettings,
    setWorkingDays: setWorkingDays,
    addHoliday:     addHoliday,
    removeHoliday:  removeHoliday,
    setTimezone:    setTimezone
  });
})();
