/* ============================================================================
   File: src/services/projectService.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.services.projectService
   Dependencies: PPM.domain.*, PPM.adapters.*, PPM.schema, PPM.events
   ============================================================================ */
PPM.services = PPM.services || {};
(function(){
  var _state = null;

  function getState(){ return _state; }
  function _setState(s){ _state = s; PPM.events.emit('state:changed', _state); }

  function create(wizardAnswers){
    var v = PPM.domain.validation.validateWizardStep1(wizardAnswers);
    if(!v.valid) return { ok:false, error: v.error };

    var workingDays = [1,2,3,4,5];
    var milestones = PPM.domain.milestones.generateFromMethodology(
      wizardAnswers.methodology,
      PPM.domain.dates.today(),
      workingDays
    );
    var documents = PPM.domain.documents.generateDocList({
      gxpLevel: wizardAnswers.gxpLevel || 'High',
      migration: !!wizardAnswers.migration,
      integrations: !!wizardAnswers.integrations,
      integrationCount: wizardAnswers.integrationCount || 0,
      decommissioning: !!wizardAnswers.decommissioning,
      vendorPkg: wizardAnswers.vendorPkg || 'Partial'
    });
    var costs = (wizardAnswers.vendors || []).filter(function(v){ return v.name; }).map(function(v, i){
      return {
        id: i + 1, vendor: v.name, type: v.type || 'Implementation',
        contract: 'T&M', hours: v.hours || 0, rate: v.rate || 0, used: 0, notes: ''
      };
    });

    var base = PPM.schema.defaultState();
    var newState = Object.assign(base, {
      isDemo: false,
      // lifecycle stays 'draft' from defaultState; transition happens after create via lifecycleService
      meta: {
        name: wizardAnswers.name,
        id: wizardAnswers.projectId || '',
        system: wizardAnswers.system,
        methodology: wizardAnswers.methodology,
        startDate: PPM.domain.dates.today(),
        goLive: wizardAnswers.goLive,
        pm: wizardAnswers.pm,
        sponsor: wizardAnswers.sponsor || '',
        gxpLevel: wizardAnswers.gxpLevel || 'High',
        migration: !!wizardAnswers.migration,
        integrations: !!wizardAnswers.integrations,
        integrationCount: wizardAnswers.integrationCount || 0,
        decommissioning: !!wizardAnswers.decommissioning,
        vendorPkg: wizardAnswers.vendorPkg || 'Partial'
      },
      milestones: milestones,
      documents: documents,
      costs: costs,
      team: (wizardAnswers.team || []).filter(function(t){ return t.name; }),
      updatedAt: PPM.domain.dates.nowISO()
    });

    _setState(newState);

    // Phase 1 hardening: lifecycle transition is the ONLY allowed path to change lifecycle.
    // New projects auto-transition draft → active immediately on creation
    // (v1 has no approval workflow; v2 may gate this behind sponsor approval per ADR-003).
    var transitionResult = PPM.services.lifecycleService.transition('active');
    if(!transitionResult.ok){
      return { ok:false, error: 'lifecycle transition failed: ' + transitionResult.error };
    }

    var saveResult = PPM.adapters.storage.save(newState);
    if(!saveResult.ok) return { ok:false, error:'save failed: ' + saveResult.message };
    PPM.events.emit('project:created', newState);
    return { ok:true, state: newState };
  }

  function loadFromStorage(){
    var result = PPM.adapters.storage.load();
    if(!result.ok) return { ok:false, error: result.message };
    if(!result.state) return { ok:true, state: null };
    _setState(result.state);
    PPM.events.emit('project:loaded', result.state);
    return { ok:true, state: result.state };
  }

  function importFromJSON(text){
    var result = PPM.adapters.exporter.fromJSON(text);
    if(!result.ok) return { ok:false, error: result.error };
    _setState(result.state);
    PPM.adapters.storage.save(result.state);
    PPM.events.emit('project:imported', result.state);
    return { ok:true, state: result.state };
  }

  function loadDemo(){
    var demo = _buildDemoState();
    _setState(demo);
    // Phase 1 hardening: same as create() — lifecycle transition via lifecycleService only.
    // Demo state starts at 'draft' from defaultState; transition to 'active' here.
    var transitionResult = PPM.services.lifecycleService.transition('active');
    if(!transitionResult.ok){
      return { ok:false, error: 'lifecycle transition failed: ' + transitionResult.error };
    }
    PPM.adapters.storage.save(demo);
    PPM.events.emit('project:demo_loaded', demo);
    return { ok:true, state: demo };
  }

  function reset(){
    PPM.adapters.storage.clear();
    _state = null;
    PPM.events.emit('project:reset', null);
    return { ok:true };
  }

  function _buildDemoState(){
    var chars = { gxpLevel:'High', migration:true, integrations:true, integrationCount:3, decommissioning:true, vendorPkg:'Partial' };
    var documents = PPM.domain.documents.generateDocList(chars);
    var milestones = PPM.domain.milestones.generateFromMethodology('Hybrid (V-Model + Agile)', '2026-05-01', [1,2,3,4,5]);
    if(milestones[0]) { milestones[0].status = 'Complete'; milestones[0].pct = 100; milestones[0].owner = 'Vineet Pathak'; }
    if(milestones[1]) { milestones[1].status = 'Complete'; milestones[1].pct = 100; milestones[1].owner = 'Thomas Richter'; }
    if(milestones[2]) { milestones[2].status = 'In Progress'; milestones[2].pct = 65; milestones[2].owner = 'Thomas Richter'; milestones[2].notes = 'Integration specs pending review'; }
    if(milestones[7]) { milestones[7].status = 'Blocked'; milestones[7].owner = 'Maria Fischer'; milestones[7].notes = 'Blocked on UAT test scripts from QA team'; }

    var base = PPM.schema.defaultState();
    return Object.assign(base, {
      isDemo: true,
      // lifecycle stays 'draft' from defaultState; loadDemo() transitions via lifecycleService
      meta: {
        name: 'Project Helix — Veeva RIM Implementation',
        id: 'PRJ-2026-001',
        system: 'Veeva RIM',
        methodology: 'Hybrid (V-Model + Agile)',
        startDate: '2026-05-01', goLive: '2027-02-28',
        pm: 'Vineet Pathak', sponsor: 'Dr. Sarah Mueller',
        gxpLevel: 'High', migration: true, integrations: true, integrationCount: 3,
        decommissioning: true, vendorPkg: 'Partial'
      },
      milestones: milestones,
      tasks: [
        {id:1, milestoneId:4, name:'Configure RIM Submissions workflow', assignee:'Anna Schmidt', ws:'Technical Config', priority:'High', status:'Not Started', plannedStart:'2026-07-07', plannedEnd:'2026-07-18', estHrs:40, actHrs:0, notes:''},
        {id:2, milestoneId:4, name:'Configure RIM Registrations workflow', assignee:'Anna Schmidt', ws:'Technical Config', priority:'High', status:'Not Started', plannedStart:'2026-07-14', plannedEnd:'2026-07-25', estHrs:35, actHrs:0, notes:''},
        {id:3, milestoneId:5, name:'Map legacy fields to Vault structure', assignee:'Lars Weber', ws:'Migration', priority:'Critical', status:'Not Started', plannedStart:'2026-08-04', plannedEnd:'2026-08-08', estHrs:20, actHrs:0, notes:''},
        {id:4, milestoneId:4, name:'Build SAP MuleSoft integration flow', assignee:'Thomas Richter', ws:'Integration', priority:'Critical', status:'In Progress', plannedStart:'2026-07-21', plannedEnd:'2026-08-01', estHrs:50, actHrs:18, notes:''},
        {id:5, milestoneId:4, name:'Configure HA Gateway submission channel', assignee:'Thomas Richter', ws:'Integration', priority:'High', status:'In Progress', plannedStart:'2026-07-28', plannedEnd:'2026-08-08', estHrs:25, actHrs:12, notes:''}
      ],
      risks: [
        {id:1, date:'2026-05-10', category:'Vendor', desc:'Veeva PS resource contention across 3 concurrent projects', prob:4, impact:4, response:'Mitigate', owner:'Vineet Pathak', status:'Open', unforeseen:false, notes:'Lock resource names in SOW amendment'},
        {id:2, date:'2026-05-15', category:'Technical', desc:'Legacy RIM data quality — 15% records have missing fields', prob:3, impact:4, response:'Mitigate', owner:'Lars Weber', status:'Open', unforeseen:false, notes:''},
        {id:3, date:'2026-06-01', category:'Technical', desc:'MuleSoft connector latency exceeding 5s on product master sync', prob:3, impact:3, response:'Mitigate', owner:'Thomas Richter', status:'Open', unforeseen:false, notes:''},
        {id:4, date:'2026-06-10', category:'External', desc:'HA Gateway specification change mid-project', prob:2, impact:5, response:'Accept', owner:'Vineet Pathak', status:'Monitoring', unforeseen:false, notes:''},
        {id:5, date:'2026-07-01', category:'Scope', desc:'Cross-Vault connector scope expansion — Safety vault added', prob:3, impact:4, response:'Escalate', owner:'Vineet Pathak', status:'Escalated', unforeseen:true, notes:'Change request submitted to SteerCo'}
      ],
      documents: documents,
      costs: [
        {id:1, vendor:'Veeva Professional Services', type:'Implementation', contract:'T&M', hours:800, rate:200, used:180, notes:'On track'},
        {id:2, vendor:'QualityOne Validation', type:'Validation', contract:'T&M', hours:400, rate:150, used:45, notes:''},
        {id:3, vendor:'IntegrationHub', type:'Integration', contract:'Fixed', hours:300, rate:150, used:0, notes:'SOW signed'},
        {id:4, vendor:'DataMigrate GmbH', type:'Migration', contract:'T&M', hours:200, rate:150, used:0, notes:''}
      ],
      comments: {
        'milestones_8': [{author:'Vineet Pathak', text:'UAT test scripts still pending from validation team.', date: PPM.domain.dates.nowISO()}]
      },
      team: [
        {name:'Vineet Pathak', role:'PM'},
        {name:'Dr. Sarah Mueller', role:'Sponsor'},
        {name:'Thomas Richter', role:'Workstream Lead'},
        {name:'Maria Fischer', role:'Validation Lead'}
      ]
    });
  }

  // ARCHITECTURE: UI must not call PPM.adapters.* directly.
  // exportToFile wraps the exporter+downloader so UI consumes service only.
  // Returns { ok: bool, error?: string, filename?: string }.
  function exportToFile(){
    var state = getState();
    if(!state) return { ok:false, error:'No project loaded' };
    try {
      var payload = PPM.adapters.exporter.toJSON(state, state.meta && state.meta.pm);
      var fnSafe = (state.meta && state.meta.name || 'project').replace(/[^a-zA-Z0-9]/g, '_');
      var filename = fnSafe + '_' + PPM.domain.dates.today() + '.json';
      var content = JSON.stringify(payload, null, 2);
      PPM.adapters.exporter.downloadBlob(content, filename, 'application/json');
      return { ok:true, filename: filename };
    } catch(e){
      return { ok:false, error: e.message || 'Export failed' };
    }
  }

  PPM.services.projectService = Object.freeze({
    getState:        getState,
    create:          create,
    loadFromStorage: loadFromStorage,
    importFromJSON:  importFromJSON,
    loadDemo:        loadDemo,
    reset:           reset,
    exportToFile:    exportToFile
  });
})();
