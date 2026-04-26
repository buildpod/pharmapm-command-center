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

  function cascade(milestones, workingDays){
    var topo = topologicalSort(milestones);
    if(!topo.sorted) return { milestones: milestones.slice(), error: 'Circular dependency' };
    var result = milestones.map(function(m){ return Object.assign({}, m); });
    var byId = {};
    result.forEach(function(m){ byId[m.id] = m; });
    topo.sorted.forEach(function(id){
      var ms = byId[id];
      if(ms.predecessor){
        var pred = byId[ms.predecessor];
        if(pred && pred.plannedEnd){
          var lag = parseInt(ms.lag) || 0;
          var newStart = dates.addWorkingDays(pred.plannedEnd, 1 + lag, workingDays);
          if(!newStart) return;
          // Only push forward if predecessor moved or if milestone not started
          if(dates.compare(newStart, ms.plannedStart) > 0 || ms.status === 'Not Started'){
            ms.plannedStart = newStart;
            var dur = parseInt(ms.duration) || 1;
            ms.plannedEnd = dates.addWorkingDays(ms.plannedStart, dur - 1, workingDays);
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

  // Public API — frozen
  PPM.domain.scheduling = Object.freeze({
    topologicalSort: topologicalSort,
    cascade:         cascade,
    computeRAG:      computeRAG
  });
})();
