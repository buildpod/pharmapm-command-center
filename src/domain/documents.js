/* ============================================================================
   File: src/domain/documents.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.domain.documents
   Dependencies: PPM.config
   Purpose: Generate document checklist from project characteristics using
   configurable rules. Domain does not hardcode doc names.
   ============================================================================ */
(function(){
  function generateDocList(characteristics){
    var cfg = PPM.config.rules.documents;
    var docs = [];
    var id = 1;

    function push(def, rationale){
      docs.push({
        id: id++,
        name: def.name,
        category: def.category,
        applicability: 'Required',
        rationale: rationale || def.rationale || 'Required',
        owner: '',
        status: 'Not Started',
        targetDate: '',
        notes: ''
      });
    }

    // Always
    cfg.always.forEach(function(d){ push(d); });

    // GxP-driven
    if(characteristics.gxpLevel === 'High'){
      cfg.gxpHigh.forEach(function(d){ push(d, 'GxP High'); });
    } else if(characteristics.gxpLevel === 'Medium'){
      cfg.gxpMedium.forEach(function(d){ push(d, 'GxP Medium'); });
    } else if(characteristics.gxpLevel === 'Low'){
      cfg.gxpLow.forEach(function(d){ push(d, 'GxP Low'); });
    }

    // Migration
    if(characteristics.migration){
      cfg.migration.forEach(function(d){ push(d, 'Migration required'); });
    }

    // Integrations — per-integration expansion
    var n = parseInt(characteristics.integrationCount) || 0;
    if(characteristics.integrations && n > 0){
      for(var i = 1; i <= n; i++){
        cfg.perIntegration.forEach(function(d){
          push({ name: d.name + ' #' + i, category: d.category }, 'Integration #' + i);
        });
      }
    }

    // Decommissioning
    if(characteristics.decommissioning){
      cfg.decommissioning.forEach(function(d){ push(d, 'Legacy retirement'); });
    }

    // Vendor package
    if(characteristics.vendorPkg === 'Partial'){
      cfg.partialVendorPkg.forEach(function(d){ push(d, 'Partial vendor package'); });
    }

    return docs;
  }

  // Returns a human-readable string indicating who the document is currently
  // pending with, based on the two-cycle pharma workflow:
  //   Not Started / In Draft -> owner (or '—')
  //   In Review               -> reviewers (or owner if no reviewers set)
  //   Reviewed                -> owner (must submit for approval)
  //   In Approval             -> approvers (or owner if no approvers set)
  //   Approved / Rejected / N/A -> '—'
  // Pure. Used by viewService.enrichRow for the _pendingWith computed column.
  function computePendingWith(doc){
    if(!doc) return '—';
    var st = doc.status;
    if(st === 'Approved' || st === 'N/A' || st === 'Rejected') return '—';
    var reviewers = (doc.reviewers || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    var approvers = (doc.approvers || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    if(st === 'In Review'){
      if(reviewers.length > 0) return reviewers.join(', ');
      return doc.owner || '—';
    }
    if(st === 'In Approval'){
      if(approvers.length > 0) return approvers.join(', ');
      return doc.owner || '—';
    }
    // Not Started, In Draft, Reviewed -> owner is responsible
    if(doc.owner) return doc.owner;
    return '—';
  }

  PPM.domain.documents = Object.freeze({
    generateDocList:    generateDocList,
    computePendingWith: computePendingWith
  });
})();
