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

  PPM.domain.documents = Object.freeze({
    generateDocList: generateDocList
  });
})();
