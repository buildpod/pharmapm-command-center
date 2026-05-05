/* ============================================================================
   File: src/domain/scheduling.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.domain.scheduling
   Dependencies: PPM.domain.dates, PPM.config
   Purpose: Milestone dependency cascade + RAG status.
   No native Date usage. Reads thresholds from PPM.config.rules.rag.
   ============================================================================ */
(function(){
  var dates = PPM.domain.dates;

  function topologicalSort(milestones){
    var graph = {}, inDegree = {};
    milestones.forEach(function(m){ graph[m.id] = []; inDegree[m.id] = 0; });
    milestones.forEach(function(m){
      if(m.predecessor && graph[m.predecessor] !== undefined){
        graph[m.predecessor].push(m.id);
        inDegree[m.id]++;
      }
    });
    var queue = [], sorted = [];
    Object.keys(inDegree).forEach(function(id){ if(inDegree[id] === 0) queue.push(parseInt(id)); });
    while(queue.length){
      var n = queue.shift();
      sorted.push(n);
      (graph[n] || []).forEach(function(succ){
        inDegree[succ]--;
        if(inDegree[succ] === 0) queue.push(succ);
      });
    }
    return {
      sorted: sorted.length === milestones.length ? sorted : null,
      hasCycle: sorted.length < milestones.length
    };
  }

  function cascade(milestones, workingDays, holidays){
    var topo = topologicalSort(milestones);
    if(!topo.sorted) return { milestones: milestones.slice(), error: 'Circular dependency' };
    var result = milestones.map(function(m){ return Object.assign({}, m); });
    var byId = {};
    result.forEach(function(m){ byId[m.id] = m; });
    topo.sorted.forEach(function(id){
      var ms = byId[id];
      // FRS-005d v1.1: if user has locked this milestone's date, skip cascade.
      // Successors still see this milestone's plannedEnd as their constraint;
      // only this row's own dates remain pinned.
      if(ms.lockDate === true) return;
      if(ms.predecessor){
        var pred = byId[ms.predecessor];
        if(pred && pred.plannedEnd){
          var lag = parseInt(ms.lag) || 0;
          var newStart = dates.addWorkingDays(pred.plannedEnd, 1 + lag, workingDays, holidays);
          if(!newStart) return;
          // Only push forward if predecessor moved or if milestone not started
          if(dates.compare(newStart, ms.plannedStart) > 0 || ms.status === 'Not Started'){
            ms.plannedStart = newStart;
            var dur = parseInt(ms.duration) || 1;
            ms.plannedEnd = dates.addWorkingDays(ms.plannedStart, dur - 1, workingDays, holidays);
          }
        }
      }
    });
    return { milestones: result, error: null };
  }

  function computeRAG(milestone, todayStr){
    var today = todayStr || dates.today();
    if(milestone.status === 'Complete') return 'Green';
    if(milestone.status === 'Blocked') return 'Red';
    if(!milestone.plannedEnd) return 'Green';
    var delay = Math.max(0, dates.daysBetween(milestone.plannedEnd, today));
    var cfg = PPM.config.rules.rag;
    if(delay > cfg.redDelayDays) return 'Red';
    if(delay > cfg.amberDelayDays) return 'Amber';
    return 'Green';
  }

  // -------------------------------------------------------------------------
  // FRS-005: Dependency Status (Clear / Waiting / Blocked)
  //
  // Status definitions (from April 12 transcript, agreed v1 scope):
  //   Clear   = no predecessor, OR predecessor is Complete
  //   Waiting = predecessor exists and isn't Complete, but milestone's planned
  //             start hasn't arrived yet (no impact on schedule)
  //   Blocked = predecessor isn't Complete AND milestone's planned start has
  //             already passed (the predecessor is now actively blocking)
  //
  // computeDependencyStatus is pure. Takes the milestone, the full set of
  // milestones (to look up predecessor), and an optional today string for
  // determinism in tests.
  // -------------------------------------------------------------------------
  function computeDependencyStatus(milestone, allMilestones, todayStr){
    if(!milestone || !milestone.predecessor) return 'Clear';
    var pred = (allMilestones || []).find(function(m){ return m.id === milestone.predecessor; });
    if(!pred) return 'Clear';                       // broken reference: don't block
    if(pred.status === 'Complete') return 'Clear';
    var today = todayStr || dates.today();
    if(milestone.plannedStart && dates.compare(milestone.plannedStart, today) <= 0){
      return 'Blocked';                             // planned start already passed
    }
    return 'Waiting';                               // predecessor pending but not yet blocking
  }

  // -------------------------------------------------------------------------
  // FRS-005b: Backward Scheduling (from agreed v1 scope)
  //
  // Given an anchor date (e.g. go-live), compute backward through dependency
  // chain so that terminal milestone (no successors) lands on the anchor and
  // each predecessor lands before its successor by (1 + lag) working days.
  //
  // Pure. Returns { milestones, error }. Does not mutate input.
  //
  // Algorithm:
  //   1. Topological sort (existing). If cycle, return error.
  //   2. Iterate in REVERSE topological order.
  //   3. For each milestone:
  //        - find successors (milestones whose predecessor === this id)
  //        - if no successors: end = anchorDate
  //        - else: end = earliest successor start - 1 working day - lag
  //        - start = end - (duration - 1) working days
  // -------------------------------------------------------------------------
  function scheduleBackward(milestones, anchorDate, workingDays, holidays){
    var topo = topologicalSort(milestones);
    if(!topo.sorted) return { milestones: milestones.slice(), error: 'Circular dependency' };
    if(!anchorDate) return { milestones: milestones.slice(), error: 'No anchor date' };

    var result = milestones.map(function(m){ return Object.assign({}, m); });
    var byId = {};
    result.forEach(function(m){ byId[m.id] = m; });

    // Reverse topological order — process leaves (terminal milestones) first
    var reversed = topo.sorted.slice().reverse();

    reversed.forEach(function(id){
      var ms = byId[id];
      // FRS-005d v1.1: locked milestones keep their dates — they act as anchor
      // points within the chain. The successor's start still constrains the
      // pre-predecessor walk-back, but THIS row's dates don't change.
      if(ms.lockDate === true) return;
      var successors = result.filter(function(m){ return m.predecessor === id; });
      var dur = parseInt(ms.duration) || 1;
      var lag = parseInt(ms.lag) || 0;

      var endDate;
      if(successors.length === 0){
        // Terminal milestone — anchor it
        endDate = anchorDate;
      } else {
        // End must be at least (1 + successor's lag) working days before earliest successor start
        var earliestSuccStart = null;
        successors.forEach(function(succ){
          if(!succ.plannedStart) return;
          if(!earliestSuccStart || dates.compare(succ.plannedStart, earliestSuccStart) < 0){
            earliestSuccStart = succ.plannedStart;
          }
        });
        if(!earliestSuccStart) return;
        // Subtract 1 + this ms's lag (i.e., the gap that the cascade would re-add going forward)
        endDate = dates.addWorkingDays(earliestSuccStart, -(1 + lag), workingDays, holidays);
      }

      if(!endDate) return;
      ms.plannedEnd = endDate;
      ms.plannedStart = dates.addWorkingDays(endDate, -(dur - 1), workingDays, holidays);
    });

    return { milestones: result, error: null };
  }

  // -------------------------------------------------------------------------
  // FRS-005c: Cascade Preview (agreed v1 scope — tooltip, not full sandbox)
  //
  // Given a current state and a proposed edit, return what would change
  // WITHOUT mutating. UI uses this to show the user "this will shift N
  // downstream milestones" before they commit the change.
  //
  // Returns: {
  //   affected: [{ id, name, oldStart, newStart, oldEnd, newEnd, daysShifted }],
  //   error: string|null
  // }
  // -------------------------------------------------------------------------
  function previewCascade(milestones, edit, workingDays, holidays){
    if(!edit || edit.field == null) return { affected: [], error: null };
    if(['plannedStart','plannedEnd','duration','predecessor','lag'].indexOf(edit.field) < 0){
      return { affected: [], error: null };          // not a schedule-affecting field
    }

    // Build a hypothetical state by applying the edit to a deep copy
    var hypothetical = milestones.map(function(m){
      if(m.id !== edit.id) return Object.assign({}, m);
      var copy = Object.assign({}, m);
      copy[edit.field] = edit.value;
      // If duration changed, also recompute end (start + dur - 1)
      if(edit.field === 'duration' && copy.plannedStart){
        var dur = parseInt(copy.duration) || 1;
        copy.plannedEnd = dates.addWorkingDays(copy.plannedStart, dur - 1, workingDays, holidays);
      }
      return copy;
    });

    var cascadeResult = cascade(hypothetical, workingDays, holidays);
    if(cascadeResult.error) return { affected: [], error: cascadeResult.error };

    // Compare original vs cascaded — find rows that shifted (excluding the edited row itself)
    var originalById = {};
    milestones.forEach(function(m){ originalById[m.id] = m; });

    var affected = [];
    cascadeResult.milestones.forEach(function(after){
      if(after.id === edit.id) return;               // don't list the row the user is editing
      var before = originalById[after.id];
      if(!before) return;
      var startShifted = before.plannedStart !== after.plannedStart;
      var endShifted   = before.plannedEnd   !== after.plannedEnd;
      if(startShifted || endShifted){
        var daysShifted = 0;
        if(before.plannedStart && after.plannedStart){
          daysShifted = dates.daysBetween(before.plannedStart, after.plannedStart);
        }
        affected.push({
          id:           after.id,
          name:         after.name,
          oldStart:     before.plannedStart,
          newStart:     after.plannedStart,
          oldEnd:       before.plannedEnd,
          newEnd:       after.plannedEnd,
          daysShifted:  daysShifted
        });
      }
    });

    return { affected: affected, error: null };
  }

  // -------------------------------------------------------------------------
  // Helper: compute end date from start + duration (or vice versa)
  // Used by editService when user edits duration — auto-update end.
  // Pure.
  // -------------------------------------------------------------------------
  function computeEndFromDuration(startDate, duration, workingDays, holidays){
    if(!startDate) return null;
    var dur = parseInt(duration) || 1;
    return dates.addWorkingDays(startDate, dur - 1, workingDays, holidays);
  }

  function computeDurationFromDates(startDate, endDate, workingDays, holidays){
    if(!startDate || !endDate) return null;
    if(dates.compare(startDate, endDate) > 0) return null;
    // Inclusive working-day count: walk from start to end, counting each working day
    var wd = workingDays || [1,2,3,4,5];
    var count = 0;
    var cursor = startDate;
    var guard = 0;
    while(dates.compare(cursor, endDate) <= 0){
      count++;
      var next = dates.addWorkingDays(cursor, 1, wd, holidays);
      if(!next || next === cursor) break;
      cursor = next;
      guard++;
      if(guard > 10000) break;
    }
    return count;
  }

  // Public API — frozen
  PPM.domain.scheduling = Object.freeze({
    topologicalSort:           topologicalSort,
    cascade:                   cascade,
    computeRAG:                computeRAG,
    computeDependencyStatus:   computeDependencyStatus,
    scheduleBackward:          scheduleBackward,
    previewCascade:            previewCascade,
    computeEndFromDuration:    computeEndFromDuration,
    computeDurationFromDates:  computeDurationFromDates
  });
})();
