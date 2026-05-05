/* ============================================================================
   File: src/services/editService.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.services.editService
   Dependencies: PPM.services.projectService, PPM.domain.*, PPM.adapters.storage
   ============================================================================ */
(function(){
  var saveTimer = null;

  // Phase 1 hardening: top-level immutable fields.
  // These must never be edited via cell edit. Each has a specific reason:
  //   projectId     — identity, immutable for life of project (ADR-002)
  //   createdAt     — historical fact
  //   schemaVersion — only migrations may change this
  //   isDemo        — only loadDemo()/reset() may change this
  //   lifecycle     — only lifecycleService.transition may change this
  var IMMUTABLE_TOP_LEVEL = ['projectId', 'createdAt', 'schemaVersion', 'isDemo', 'lifecycle'];

  function applyCellEdit(table, id, field, value){
    var state = PPM.services.projectService.getState();
    if(!state) return { ok:false, error:'No project loaded' };

    // Phase 1 hardening: reject attempts to edit top-level immutable fields
    // via the cell-edit path. Callers using table='__top__' to mutate state
    // root-level fields are blocked here. Lifecycle has its own service.
    if(table === '__top__' || table == null){
      if(IMMUTABLE_TOP_LEVEL.indexOf(field) >= 0){
        return { ok:false, error:'immutable_field', message: 'Field "' + field + '" is immutable and cannot be edited via cell edit.' };
      }
    }

    if(!state[table]) return { ok:false, error:'Table not found: ' + table };
    var row = state[table].find(function(r){ return r.id === id; });
    if(!row) return { ok:false, error:'Row not found' };

    // Defensive: even on row-level edits, refuse to overwrite a row's own immutable
    // identity field (rows have 'id' which must not change once assigned).
    if(field === 'id'){
      return { ok:false, error:'immutable_field', message: 'Row id is immutable.' };
    }

    row[field] = value;
    state.updatedAt = PPM.domain.dates.nowISO();

    // FRS-005: Duration ↔ end-date binding for milestones.
    // If user edits duration and the milestone has a plannedStart, recompute
    // plannedEnd. This must happen BEFORE the cascade so it sees consistent
    // dates. Pure value derivation — no service calls, no events.
    if(table === 'milestones' && field === 'duration' && row.plannedStart){
      var workingDays = state.settings && state.settings.workingDays;
      var holidays    = state.settings && state.settings.holidays;
      var newEnd = PPM.domain.scheduling.computeEndFromDuration(row.plannedStart, value, workingDays, holidays);
      if(newEnd) row.plannedEnd = newEnd;
    }
    // If user edits plannedStart and duration is set, also push plannedEnd forward
    if(table === 'milestones' && field === 'plannedStart' && row.duration){
      var wd2 = state.settings && state.settings.workingDays;
      var hol2 = state.settings && state.settings.holidays;
      var newEnd2 = PPM.domain.scheduling.computeEndFromDuration(value, row.duration, wd2, hol2);
      if(newEnd2) row.plannedEnd = newEnd2;
    }

    if(table === 'milestones' && ['plannedStart','plannedEnd','duration','predecessor','lag'].indexOf(field) >= 0){
      var cascadeResult = PPM.domain.scheduling.cascade(
        state.milestones,
        state.settings && state.settings.workingDays,
        state.settings && state.settings.holidays
      );
      if(cascadeResult.error){
        PPM.events.emit('schedule:cycle_detected', cascadeResult.error);
      } else {
        state.milestones = cascadeResult.milestones;
      }
    }
    PPM.events.emit('state:changed', state);
    _queueSave(state);
    return { ok:true };
  }

  function addRow(table, rowDefaults){
    var state = PPM.services.projectService.getState();
    if(!state) return { ok:false, error:'No project loaded' };
    if(!state[table]) state[table] = [];
    var maxId = state[table].reduce(function(m, r){ return Math.max(m, r.id || 0); }, 0);
    var newRow = Object.assign({ id: maxId + 1 }, rowDefaults || {});
    state[table].push(newRow);
    state.updatedAt = PPM.domain.dates.nowISO();
    PPM.events.emit('state:changed', state);
    _queueSave(state);
    return { ok:true, row: newRow };
  }

  function deleteRow(table, id){
    var state = PPM.services.projectService.getState();
    if(!state || !state[table]) return { ok:false };
    state[table] = state[table].filter(function(r){ return r.id !== id; });
    state.updatedAt = PPM.domain.dates.nowISO();
    PPM.events.emit('state:changed', state);
    _queueSave(state);
    return { ok:true };
  }

  // Phase 1 hardening: emit specific 'storage:quota_exceeded' event when adapter
  // returns error: 'quota'. UI subscribes to this to show export prompt banner.
  function _emitSaveResult(result){
    if(result.ok){
      PPM.events.emit('storage:saved', PPM.domain.dates.nowISO());
    } else if(result.error === 'quota'){
      PPM.events.emit('storage:quota_exceeded', result);
    } else {
      PPM.events.emit('storage:error', result);
    }
  }

  function _queueSave(state){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){
      var result = PPM.adapters.storage.save(state);
      _emitSaveResult(result);
    }, 400);
  }

  function forceSave(){
    var state = PPM.services.projectService.getState();
    if(!state) return;
    clearTimeout(saveTimer);
    var result = PPM.adapters.storage.save(state);
    _emitSaveResult(result);
  }

  PPM.services.editService = Object.freeze({
    applyCellEdit:       applyCellEdit,
    addRow:              addRow,
    deleteRow:           deleteRow,
    forceSave:           forceSave,
    IMMUTABLE_TOP_LEVEL: Object.freeze(IMMUTABLE_TOP_LEVEL.slice())
  });
})();
