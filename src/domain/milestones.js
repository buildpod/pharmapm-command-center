/* ============================================================================
   File: src/domain/milestones.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.domain.milestones
   Dependencies: PPM.domain.dates, PPM.config
   ============================================================================ */
(function(){
  var dates = PPM.domain.dates;

  function generateFromMethodology(methodology, startDateISO, workingDays){
    var templates = PPM.config.rules.methodologies;
    var template = templates[methodology] || templates['V-Model (GxP)'];
    var start = startDateISO || dates.today();
    var out = [];
    var currentStart = start;
    template.forEach(function(t, i){
      var id = i + 1;
      var end = dates.addWorkingDays(currentStart, t.dur - 1, workingDays);
      out.push({
        id: id,
        phase: t.phase,
        name: t.name,
        owner: '',
        ws: 'PM & Governance',
        plannedStart: currentStart,
        plannedEnd: end,
        duration: t.dur,
        predecessor: t.pred || null,
        lag: t.lag || 0,
        status: 'Not Started',
        pct: 0,
        notes: ''
      });
      currentStart = dates.addWorkingDays(end, 1, workingDays);
    });
    return out;
  }

  function listMethodologies(){
    return Object.keys(PPM.config.rules.methodologies);
  }

  PPM.domain.milestones = Object.freeze({
    generateFromMethodology: generateFromMethodology,
    listMethodologies:       listMethodologies
  });
})();
