/* ============================================================================
   File: src/ui/columns.js
   Dependencies: PPM (root namespace)
   Exports: PPM.ui.columns — column definitions per table.

   Column spec:
     key:      field name on the row
     label:    column header
     type:     'text' | 'number' | 'date' | 'dropdown' | 'computed' | 'auto'
     w:        column width in px
     num:      true for numeric/tabular-nums columns (right-aligned)
     options:  array of allowed values (for dropdown type)
     help:     tooltip text (shown on detail pane and column header hover)
     immutable: skip edit on this column (id columns)
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};

  // Pull enum values from config so they stay in sync
  var enums = PPM.config.rules.enums;

  var columns = {
    milestones: [
      { key:'id',           label:'#',         type:'auto',     w:42,  num:true, immutable:true },
      { key:'phase',        label:'Phase',     type:'text',     w:120 },
      { key:'name',         label:'Milestone', type:'text',     w:240 },
      { key:'owner',        label:'Owner',     type:'text',     w:140 },
      { key:'plannedStart', label:'Start',     type:'date',     w:120, num:true },
      { key:'plannedEnd',   label:'End',       type:'date',     w:120, num:true },
      { key:'duration',     label:'Days',      type:'number',   w:64,  num:true },
      { key:'predecessor',  label:'Pred',      type:'number',   w:60,  num:true, help:'Predecessor milestone ID (Finish-to-Start with optional lag)' },
      { key:'lag',          label:'Lag',       type:'number',   w:54,  num:true, help:'Working days buffer after predecessor completes' },
      { key:'status',       label:'Status',    type:'dropdown', w:130, options: enums.milestoneStatus },
      { key:'pct',          label:'%',         type:'number',   w:60,  num:true },
      { key:'_rag',         label:'RAG',       type:'computed', w:80 },
      { key:'notes',        label:'Notes',     type:'text',     w:220 }
    ],
    tasks: [
      { key:'id',           label:'#',         type:'auto',     w:42,  num:true, immutable:true },
      { key:'milestoneId',  label:'MS',        type:'number',   w:54,  num:true, help:'Linked milestone ID' },
      { key:'name',         label:'Task',      type:'text',     w:260 },
      { key:'assignee',     label:'Assignee',  type:'text',     w:140 },
      { key:'ws',           label:'Workstream',type:'text',     w:140 },
      { key:'priority',     label:'Priority',  type:'dropdown', w:100, options: enums.taskPriority },
      { key:'status',       label:'Status',    type:'dropdown', w:120, options: enums.taskStatus },
      { key:'plannedStart', label:'Start',     type:'date',     w:120, num:true },
      { key:'plannedEnd',   label:'End',       type:'date',     w:120, num:true },
      { key:'estHrs',       label:'Est h',     type:'number',   w:64,  num:true },
      { key:'actHrs',       label:'Act h',     type:'number',   w:64,  num:true },
      { key:'_variance',    label:'Var',       type:'computed', w:60,  num:true },
      { key:'notes',        label:'Notes',     type:'text',     w:200 }
    ],
    risks: [
      { key:'id',         label:'#',          type:'auto',     w:42,  num:true, immutable:true },
      { key:'date',       label:'Identified', type:'date',     w:110, num:true },
      { key:'category',   label:'Category',   type:'dropdown', w:110, options: enums.riskCategory },
      { key:'desc',       label:'Description',type:'text',     w:300 },
      { key:'prob',       label:'P',          type:'dropdown', w:54,  num:true, options:['1','2','3','4','5'], help:'Probability: 1=Very Low, 5=Very High' },
      { key:'impact',     label:'I',          type:'dropdown', w:54,  num:true, options:['1','2','3','4','5'], help:'Impact: 1=Very Low, 5=Very High' },
      { key:'_score',     label:'Score',      type:'computed', w:70,  num:true },
      { key:'response',   label:'Response',   type:'dropdown', w:100, options: enums.riskResponse },
      { key:'owner',      label:'Owner',      type:'text',     w:140 },
      { key:'status',     label:'Status',     type:'dropdown', w:110, options: enums.riskStatus },
      { key:'unforeseen', label:'Unforeseen', type:'dropdown', w:100, options:['true','false'], help:'Unforeseen risks get an orange flag' },
      { key:'notes',      label:'Notes',      type:'text',     w:200 }
    ],
    documents: [
      { key:'id',            label:'#',         type:'auto',     w:42,  num:true, immutable:true },
      { key:'name',          label:'Document',  type:'text',     w:280 },
      { key:'category',      label:'Category',  type:'dropdown', w:130, options: enums.docCategory },
      { key:'applicability', label:'Applies',   type:'dropdown', w:100, options: enums.docApplicability },
      { key:'rationale',     label:'Why',       type:'text',     w:160, help:'Why this document is required, based on project characteristics' },
      { key:'owner',         label:'Owner',     type:'text',     w:140 },
      { key:'status',        label:'Status',    type:'dropdown', w:120, options: enums.docStatus },
      { key:'targetDate',    label:'Target',    type:'date',     w:120, num:true },
      { key:'notes',         label:'Notes',     type:'text',     w:200 }
    ],
    costs: [
      { key:'id',          label:'#',         type:'auto',     w:42,  num:true, immutable:true },
      { key:'vendor',      label:'Vendor',    type:'text',     w:240 },
      { key:'type',        label:'Type',      type:'dropdown', w:130, options: enums.costType },
      { key:'contract',    label:'Contract',  type:'dropdown', w:100, options: enums.contractType },
      { key:'hours',       label:'Contracted',type:'number',   w:100, num:true },
      { key:'rate',        label:'€/h',       type:'number',   w:80,  num:true },
      { key:'used',        label:'Used h',    type:'number',   w:84,  num:true },
      { key:'_burn',       label:'Burn',      type:'computed', w:80 },
      { key:'_cost',       label:'Spent',     type:'computed', w:110, num:true },
      { key:'_budgetRag',  label:'RAG',       type:'computed', w:80 },
      { key:'notes',       label:'Notes',     type:'text',     w:180 }
    ]
  };

  // Default new-row template per table — used when "Add row" clicked.
  // ARCHITECTURE: dates come from viewService, not PPM.domain.dates directly.
  function newRowDefaults(table){
    var today = PPM.services.viewService.today();
    if(table === 'milestones'){
      return { phase:'', name:'New milestone', owner:'', ws:'', plannedStart:today, plannedEnd:PPM.services.viewService.addWorkingDays(today, 4), duration:5, predecessor:null, lag:0, status:'Not Started', pct:0, notes:'' };
    }
    if(table === 'tasks'){
      return { milestoneId:null, name:'New task', assignee:'', ws:'', priority:'Medium', status:'Not Started', plannedStart:today, plannedEnd:today, estHrs:0, actHrs:0, notes:'' };
    }
    if(table === 'risks'){
      return { date:today, category:'Technical', desc:'New risk', prob:3, impact:3, response:'Mitigate', owner:'', status:'Open', unforeseen:false, notes:'' };
    }
    if(table === 'documents'){
      return { name:'New document', category:'Governance', applicability:'Required', rationale:'', owner:'', status:'Not Started', targetDate:'', notes:'' };
    }
    if(table === 'costs'){
      return { vendor:'New vendor', type:'Implementation', contract:'T&M', hours:0, rate:0, used:0, notes:'' };
    }
    return {};
  }

  PPM.ui.columns = Object.freeze({
    get: function(table){ return columns[table] ? columns[table].slice() : []; },
    newRowDefaults: newRowDefaults
  });
})();
