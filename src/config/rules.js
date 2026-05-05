/* ============================================================================
   File: src/config/rules.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.config
   Dependencies: none
   Purpose: Tunable business rules. Domain reads from here. No code depends on
   specific values — only on the config interface.
   ============================================================================ */
(function(){
  var rules = {
    // RAG computation thresholds (used by domain.scheduling.computeRAG)
    rag: {
      redDelayDays: 5,           // overdue > this many days = Red
      amberDelayDays: 0          // overdue > this = Amber (until red threshold)
    },

    // Risk score bands (used by domain.risk.scoreBand)
    risk: {
      highScore: 15,
      mediumScore: 8
    },

    // Budget burn bands (used by domain.budget.burnBand)
    burn: {
      redPct: 85,
      amberPct: 60
    },

    // Document generation rules
    // Each rule: { when: (characteristics) => bool, docs: [{name, category}] }
    documents: {
      always: [
        { name: 'Project Charter', category: 'Governance', rationale: 'Always required' },
        { name: 'Project Plan', category: 'Governance', rationale: 'Always required' },
        { name: 'Risk Management Plan', category: 'Governance', rationale: 'Always required' },
        { name: 'Training Plan', category: 'Training', rationale: 'Always required' },
        { name: 'Go-Live Checklist', category: 'Governance', rationale: 'Always required' }
      ],
      gxpHigh: [
        { name: 'Validation Plan', category: 'Validation' },
        { name: 'User Requirements Specification (URS)', category: 'Validation' },
        { name: 'Traceability Matrix', category: 'Validation' },
        { name: 'Validation Summary Report', category: 'Validation' },
        { name: 'Functional Specification (FS)', category: 'Validation' },
        { name: 'Design Specification (DS)', category: 'Validation' },
        { name: 'IQ Protocol & Report', category: 'Validation' },
        { name: 'OQ Protocol & Report', category: 'Validation' },
        { name: 'PQ Protocol & Report', category: 'Validation' }
      ],
      gxpMedium: [
        { name: 'Validation Plan', category: 'Validation' },
        { name: 'User Requirements Specification (URS)', category: 'Validation' },
        { name: 'Traceability Matrix', category: 'Validation' },
        { name: 'Validation Summary Report', category: 'Validation' },
        { name: 'Combined FS/DS', category: 'Validation' },
        { name: 'OQ Protocol & Report', category: 'Validation' },
        { name: 'PQ Protocol & Report', category: 'Validation' }
      ],
      gxpLow: [
        { name: 'Simplified Qualification Protocol', category: 'Validation' },
        { name: 'Qualification Report', category: 'Validation' }
      ],
      migration: [
        { name: 'Data Migration Plan', category: 'Migration' },
        { name: 'Data Migration Specification', category: 'Migration' },
        { name: 'Data Migration Verification Report', category: 'Migration' },
        { name: 'Data Integrity Assessment', category: 'Migration' }
      ],
      perIntegration: [
        { name: 'Integration Specification', category: 'Integration' },
        { name: 'Interface Test Protocol', category: 'Integration' }
      ],
      decommissioning: [
        { name: 'Decommissioning Plan', category: 'Decommissioning' },
        { name: 'Data Retention Assessment', category: 'Decommissioning' },
        { name: 'Decommissioning Report', category: 'Decommissioning' }
      ],
      partialVendorPkg: [
        { name: 'Vendor Assessment Report', category: 'Validation' },
        { name: 'Vendor Documentation Gap Analysis', category: 'Validation' }
      ]
    },

    // Methodology phase templates
    methodologies: {
      'V-Model (GxP)': [
        {phase:'Requirements', name:'URS Approved', dur:20},
        {phase:'Design', name:'FS Approved', dur:15, pred:1, lag:2},
        {phase:'Design', name:'DS Approved', dur:10, pred:2, lag:1},
        {phase:'Build', name:'Configuration Complete', dur:25, pred:3, lag:1},
        {phase:'Qualification', name:'IQ Executed', dur:10, pred:4, lag:1},
        {phase:'Qualification', name:'OQ Executed', dur:15, pred:5, lag:1},
        {phase:'Qualification', name:'PQ Executed', dur:10, pred:6, lag:1},
        {phase:'UAT', name:'UAT Sign-off', dur:10, pred:7, lag:1},
        {phase:'Readiness', name:'Training Complete', dur:15, pred:8, lag:1},
        {phase:'Readiness', name:'Go-Live Readiness Review', dur:5, pred:9, lag:1},
        {phase:'Go-Live', name:'GO-LIVE', dur:1, pred:10, lag:1},
        {phase:'Hypercare', name:'Hypercare Complete', dur:30, pred:11, lag:1}
      ],
      'Hybrid (V-Model + Agile)': [
        {phase:'Requirements', name:'URS Approved', dur:20},
        {phase:'Design', name:'FS Approved', dur:15, pred:1, lag:2},
        {phase:'Design', name:'DS Approved', dur:10, pred:2, lag:1},
        {phase:'Build', name:'Sprint 1 Complete', dur:10, pred:3, lag:1},
        {phase:'Build', name:'Sprint 2 Complete', dur:10, pred:4, lag:0},
        {phase:'Build', name:'Configuration Complete', dur:10, pred:5, lag:0},
        {phase:'Migration', name:'Data Migration Executed', dur:15, pred:6, lag:1},
        {phase:'Qualification', name:'IQ Executed', dur:10, pred:6, lag:1},
        {phase:'Qualification', name:'OQ Executed', dur:15, pred:8, lag:1},
        {phase:'Qualification', name:'PQ/UAT Sign-off', dur:10, pred:9, lag:1},
        {phase:'Readiness', name:'Go-Live Readiness Review', dur:5, pred:10, lag:1},
        {phase:'Go-Live', name:'GO-LIVE', dur:1, pred:11, lag:1}
      ],
      'Agile / Scrum': [
        {phase:'Sprint 0', name:'Backlog Groomed', dur:10},
        {phase:'Sprints', name:'Sprint 1 Complete', dur:14, pred:1, lag:0},
        {phase:'Sprints', name:'Sprint 2 Complete', dur:14, pred:2, lag:0},
        {phase:'Sprints', name:'Sprint 3 Complete', dur:14, pred:3, lag:0},
        {phase:'Release', name:'Release 1.0', dur:5, pred:4, lag:1},
        {phase:'Hypercare', name:'Hypercare Complete', dur:30, pred:5, lag:1}
      ],
      'CSA Risk-Based': [
        {phase:'Risk Assessment', name:'Risk Assessment Approved', dur:10},
        {phase:'Configuration', name:'Configuration Complete', dur:20, pred:1, lag:1},
        {phase:'Scripted Testing', name:'Scripted Tests Executed', dur:15, pred:2, lag:1},
        {phase:'UAT', name:'UAT Sign-off', dur:10, pred:3, lag:1},
        {phase:'Go-Live', name:'GO-LIVE', dur:1, pred:4, lag:1}
      ],
      'Lean / Kanban': [
        {phase:'Backlog', name:'Epic Groomed', dur:5},
        {phase:'In Flow', name:'Delivery Wave 1', dur:20, pred:1, lag:0},
        {phase:'Done', name:'Wave 1 Accepted', dur:5, pred:2, lag:1}
      ]
    },

    // Enum values used by domain validators
    enums: {
      milestoneStatus: ['Not Started', 'In Progress', 'Complete', 'Delayed', 'Blocked'],
      taskStatus: ['Not Started', 'In Progress', 'Complete', 'Blocked', 'On Hold'],
      taskPriority: ['Critical', 'High', 'Medium', 'Low'],
      riskStatus: ['Open', 'Monitoring', 'Closed', 'Escalated'],
      riskCategory: ['Technical', 'Resource', 'Regulatory', 'Vendor', 'Timeline', 'Budget', 'Scope', 'External'],
      riskResponse: ['Mitigate', 'Transfer', 'Accept', 'Avoid', 'Escalate'],
      docStatus: ['Not Started', 'In Draft', 'In Review', 'Reviewed', 'In Approval', 'Approved', 'Rejected', 'N/A'],
      docApplicability: ['Required', 'Optional', 'N/A'],
      docCategory: ['Validation', 'Migration', 'Integration', 'Training', 'Governance', 'Decommissioning'],
      costType: ['Implementation', 'Validation', 'Integration', 'Migration', 'Training', 'License', 'Internal'],
      contractType: ['T&M', 'Fixed', 'Internal'],
      gxpLevel: ['High', 'Medium', 'Low', 'N/A'],
      vendorPkg: ['Yes', 'Partial', 'No']
    }
  };

  PPM.config = Object.freeze({
    rules: rules,
    // Allow controlled override for future testing/tuning
    _override: function(newRules){
      // Only allowed in test mode; v2 may gate by user permission
      Object.assign(rules, newRules);
    }
  });
})();
