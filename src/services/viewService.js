/* ============================================================================
   File: src/services/viewService.js
   Dependencies: PPM.domain.*, PPM.config
   Exports: PPM.services.viewService

   PURPOSE
   -------
   The viewService is the ONLY way the UI layer obtains derived/computed values
   from domain logic. UI code MUST NOT call PPM.domain.* directly.

   This is the architecture rule:
     UI -> services -> domain
   Never:
     UI -> domain
     UI -> adapters

   The viewService is read-only. It does not mutate state. All mutation goes
   through editService / projectService / lifecycleService / commentService.

   When v2 introduces a backend (per ADR-001/ADR-008), this service is what
   gets fed pre-computed values from the server, instead of computing them
   client-side. UI does not need to change.

   API
   ---
   Per-row derivation:
     enrichRow(table, row, state) -> row with computed fields attached
     enrichRows(table, rows, state) -> rows[] with computed fields attached

   Project-level synthesis:
     computeProjectHealth(state) -> { level, reason }
     computeBadges(state) -> { milestones, tasks, risks, documents, costs }

   Wizard previews:
     previewMilestones(methodology, startDate) -> milestone[]
     previewDocuments(characteristics) -> document[]
     listMethodologies() -> string[]

   Date helpers UI sometimes needs:
     today() -> 'YYYY-MM-DD'
     addWorkingDays(date, n) -> 'YYYY-MM-DD'
     daysBetween(from, to) -> integer
   ============================================================================ */

(function(){
  PPM.services = PPM.services || {};

  // -------------------------------------------------------------------------
  // PER-ROW ENRICHMENT
  // -------------------------------------------------------------------------
  function enrichRow(table, row, state){
    if(!row) return row;
    var enriched = Object.assign({}, row);

    if(table === 'milestones'){
      enriched._rag = PPM.domain.scheduling.computeRAG(row);
    } else if(table === 'risks'){
      enriched._score     = PPM.domain.risk.computeScore(row);
      // Lowercase the band so CSS class names like 'ppm-status-high' work
      // consistently. Domain returns 'High'/'Medium'/'Low'; UI needs lowercase.
      enriched._scoreBand = String(PPM.domain.risk.scoreBand(enriched._score)).toLowerCase();
    } else if(table === 'costs'){
      enriched._burn      = PPM.domain.budget.computeBurn(row);
      enriched._budgetRag = String(PPM.domain.budget.burnBand(enriched._burn)).toLowerCase();
      enriched._cost      = (parseFloat(row.used) || 0) * (parseFloat(row.rate) || 0);
    } else if(table === 'tasks'){
      var est = parseFloat(row.estHrs) || 0;
      var act = parseFloat(row.actHrs) || 0;
      enriched._variance = est > 0 ? Math.round((act - est) / est * 100) : 0;
    }

    return enriched;
  }

  function enrichRows(table, rows, state){
    if(!Array.isArray(rows)) return [];
    return rows.map(function(r){ return enrichRow(table, r, state); });
  }

  // -------------------------------------------------------------------------
  // PROJECT-LEVEL SYNTHESIS
  // -------------------------------------------------------------------------
  function computeProjectHealth(state){
    return PPM.domain.health.computeProjectHealth(state);
  }

  function computeBadges(state){
    return PPM.domain.health.computeBadges(state);
  }

  // -------------------------------------------------------------------------
  // WIZARD PREVIEWS
  // -------------------------------------------------------------------------
  function previewMilestones(methodology, startDate){
    return PPM.domain.milestones.generateFromMethodology(methodology, startDate);
  }

  function previewDocuments(characteristics){
    return PPM.domain.documents.generateDocList(characteristics);
  }

  function listMethodologies(){
    return PPM.domain.milestones.listMethodologies();
  }

  // -------------------------------------------------------------------------
  // DATE HELPERS (proxy through, kept on services so UI never imports dates)
  // -------------------------------------------------------------------------
  function today(){ return PPM.domain.dates.today(); }
  function addWorkingDays(date, n){ return PPM.domain.dates.addWorkingDays(date, n); }
  function daysBetween(from, to){ return PPM.domain.dates.daysBetween(from, to); }
  function isValidISO(d){ return PPM.domain.dates.isValidISO(d); }

  // -------------------------------------------------------------------------
  // VALIDATION (proxy through, kept on services so UI never imports domain.validation)
  // -------------------------------------------------------------------------
  function validateWizardStep1(answers){
    return PPM.domain.validation.validateWizardStep1(answers);
  }

  function validateField(table, field, value){
    return PPM.domain.validation.validateField(table, field, value);
  }

  PPM.services.viewService = Object.freeze({
    // Per-row derivation
    enrichRow:            enrichRow,
    enrichRows:           enrichRows,

    // Project-level
    computeProjectHealth: computeProjectHealth,
    computeBadges:        computeBadges,

    // Wizard previews
    previewMilestones:    previewMilestones,
    previewDocuments:     previewDocuments,
    listMethodologies:    listMethodologies,

    // Date helpers
    today:                today,
    addWorkingDays:       addWorkingDays,
    daysBetween:          daysBetween,
    isValidISO:           isValidISO,

    // Validation
    validateWizardStep1:  validateWizardStep1,
    validateField:        validateField
  });
})();
