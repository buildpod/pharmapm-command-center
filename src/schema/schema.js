/* ============================================================================
   File: src/schema/schema.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.schema
   Dependencies: none (data definition only)
   Purpose: Canonical schema for project state. Frozen and versioned.
   Any change to shape requires schema version bump + migration.
   ============================================================================ */
(function(){

  // ENTITY DEFINITIONS — authoritative shape of every data object
  var entities = {

    Meta: {
      // Project-level metadata
      fields: {
        name:             { type:'string',  required:true,  maxLen:200 },
        id:               { type:'string',  required:false, maxLen:64  },
        system:           { type:'string',  required:true,  maxLen:100 },
        methodology:      { type:'string',  required:true,  maxLen:80  },
        startDate:        { type:'iso-date', required:true },
        goLive:           { type:'iso-date', required:true },
        pm:               { type:'string',  required:true,  maxLen:100 },
        sponsor:          { type:'string',  required:false, maxLen:100 },
        gxpLevel:         { type:'enum:gxpLevel',    required:true },
        migration:        { type:'boolean', required:true },
        integrations:     { type:'boolean', required:true },
        integrationCount: { type:'integer', required:false, min:0, max:50 },
        decommissioning:  { type:'boolean', required:true },
        vendorPkg:        { type:'enum:vendorPkg',   required:true }
      }
    },

    Milestone: {
      fields: {
        id:           { type:'integer', required:true, min:1 },
        phase:        { type:'string',  required:true, maxLen:60  },
        name:         { type:'string',  required:true, maxLen:200 },
        owner:        { type:'string',  required:false, maxLen:100 },
        ws:           { type:'string',  required:false, maxLen:60  },
        plannedStart: { type:'iso-date', required:true },
        plannedEnd:   { type:'iso-date', required:true },
        duration:     { type:'integer', required:true, min:1, max:500 },
        predecessor:  { type:'integer', required:false, nullable:true },
        lag:          { type:'integer', required:true, min:0, max:60 },
        lockDate:     { type:'boolean', required:false, default:false, description:'When true, cascade and backward scheduling skip this milestone (manual schedule pin).' },
        status:       { type:'enum:milestoneStatus', required:true },
        pct:          { type:'integer', required:true, min:0, max:100 },
        notes:        { type:'string',  required:false, maxLen:2000 }
      }
    },

    Task: {
      fields: {
        id:           { type:'integer', required:true },
        milestoneId:  { type:'integer', required:false, nullable:true },
        name:         { type:'string',  required:true,  maxLen:200 },
        assignee:     { type:'string',  required:false, maxLen:100 },
        ws:           { type:'string',  required:false, maxLen:60  },
        priority:     { type:'enum:taskPriority', required:true },
        status:       { type:'enum:taskStatus',   required:true },
        plannedStart: { type:'iso-date', required:false },
        plannedEnd:   { type:'iso-date', required:false },
        estHrs:       { type:'number',  required:false, min:0 },
        actHrs:       { type:'number',  required:false, min:0 },
        notes:        { type:'string',  required:false, maxLen:2000 }
      }
    },

    Risk: {
      fields: {
        id:        { type:'integer', required:true },
        date:      { type:'iso-date', required:true },
        category:  { type:'enum:riskCategory', required:true },
        desc:      { type:'string',  required:true, maxLen:500 },
        prob:      { type:'integer', required:true, min:1, max:5 },
        impact:    { type:'integer', required:true, min:1, max:5 },
        response:  { type:'enum:riskResponse', required:true },
        owner:     { type:'string',  required:false, maxLen:100 },
        status:    { type:'enum:riskStatus', required:true },
        unforeseen:{ type:'boolean', required:true },
        notes:     { type:'string',  required:false, maxLen:2000 }
      }
    },

    Document: {
      fields: {
        id:            { type:'integer', required:true },
        name:          { type:'string',  required:true, maxLen:200 },
        category:      { type:'enum:docCategory', required:true },
        applicability: { type:'enum:docApplicability', required:true },
        rationale:     { type:'string',  required:false, maxLen:200 },
        owner:         { type:'string',  required:false, maxLen:100 },
        reviewers:     { type:'string',  required:false, maxLen:300, description:'Comma-separated reviewer names. Reviewed during In Review status.' },
        approvers:     { type:'string',  required:false, maxLen:300, description:'Comma-separated approver names. Sign off during In Approval status.' },
        status:        { type:'enum:docStatus', required:true },
        targetDate:    { type:'iso-date', required:false },
        notes:         { type:'string',  required:false, maxLen:2000 }
      }
    },

    Cost: {
      fields: {
        id:       { type:'integer', required:true },
        vendor:   { type:'string',  required:true, maxLen:200 },
        type:     { type:'enum:costType', required:true },
        contract: { type:'enum:contractType', required:true },
        hours:    { type:'number',  required:true, min:0 },
        rate:     { type:'number',  required:true, min:0 },
        used:     { type:'number',  required:true, min:0 },
        notes:    { type:'string',  required:false, maxLen:2000 }
      }
    },

    TeamMember: {
      fields: {
        name: { type:'string', required:true, maxLen:100 },
        role: { type:'string', required:true, maxLen:60 }
      }
    },

    Comment: {
      fields: {
        author: { type:'string', required:true, maxLen:100 },
        text:   { type:'string', required:true, maxLen:5000 },
        date:   { type:'iso-datetime', required:true }
      }
    },

    AuditEntry: {
      // Placeholder audit shape — real event sourcing is v2 (see ADR-004)
      fields: {
        ts:     { type:'iso-datetime', required:true },
        actor:  { type:'string', required:true },
        action: { type:'string', required:true },   // e.g. "milestone.status.changed"
        target: { type:'string', required:true },   // e.g. "milestones:3"
        before: { type:'any',    required:false },
        after:  { type:'any',    required:false }
      }
    }
  };

  // STATE v1.1 — top-level shape (Phase 1 hardening: schema bump from 1.0)
  var stateV1 = {
    schemaVersion: '1.1',
    isDemo:        { type:'boolean', required:true, default:false },
    projectId:     { type:'string',  required:true, description:'UUID for multi-project identity (see ADR-002)' },
    lifecycle:     { type:'enum',    allowed:['draft','active','closed','archived'], required:true, default:'draft' },
    meta:          { type:'entity:Meta', required:true },
    settings: {
      workingDays: { type:'array<integer>', required:true, default:[1,2,3,4,5] },
      holidays:    { type:'array<iso-date>', required:true, default:[] },
      timezone:    { type:'string', required:true, default:'UTC' }
    },
    milestones:    { type:'array<entity:Milestone>', required:true, default:[] },
    tasks:         { type:'array<entity:Task>',      required:true, default:[] },
    risks:         { type:'array<entity:Risk>',      required:true, default:[] },
    documents:     { type:'array<entity:Document>',  required:true, default:[] },
    costs:         { type:'array<entity:Cost>',      required:true, default:[] },
    team:          { type:'array<entity:TeamMember>', required:false, default:[] },
    comments:      { type:'map<string, array<entity:Comment>>', required:false, default:{} },
    steerco: {
      decisions:   { type:'array<string>', required:false, default:['','','',''] }
    },
    audit:         { type:'array<entity:AuditEntry>', required:false, default:[], description:'v2: full event log. v1: optional placeholder.' },
    createdAt:     { type:'iso-datetime', required:true },
    updatedAt:     { type:'iso-datetime', required:true }
  };

  PPM.schema = Object.freeze({
    CURRENT_VERSION: '1.1',
    entities: Object.freeze(entities),
    v1: Object.freeze(stateV1),

    // Public utility: generate a UUID v4.
    // Phase 1 hardening: prefer crypto.randomUUID for cryptographic-quality entropy,
    // fall back to Math.random implementation for older browsers.
    newProjectId: function(){
      if(typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'){
        return crypto.randomUUID();
      }
      // Fallback: RFC 4122 v4 approximation (acceptable for single-user MVP only)
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    // Return default blank state conforming to schema
    defaultState: function(){
      var now = new Date().toISOString();
      return {
        schemaVersion: '1.1',
        isDemo: false,
        projectId: PPM.schema.newProjectId(),
        lifecycle: 'draft',
        meta: null,
        settings: { workingDays:[1,2,3,4,5], holidays:[], timezone:'UTC' },
        milestones: [], tasks: [], risks: [], documents: [], costs: [], team: [],
        comments: {},
        steerco: { decisions:['','','',''] },
        audit: [],
        createdAt: now,
        updatedAt: now
      };
    }
  });
})();
