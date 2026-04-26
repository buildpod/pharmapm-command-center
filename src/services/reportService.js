/* ============================================================================
   File: src/services/reportService.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.services.reportService
   ============================================================================ */
(function(){
  function buildDashboardData(state){
    if(!state) return null;
    var today = PPM.domain.dates.today();
    var ms = state.milestones || [];
    var ts = state.tasks || [];
    var rs = state.risks || [];
    var ds = state.documents || [];
    var cs = state.costs || [];
    var msComplete = ms.filter(function(m){ return m.status === 'Complete'; }).length;
    var tsComplete = ts.filter(function(t){ return t.status === 'Complete'; }).length;
    var rsOpen = rs.filter(function(r){ return r.status !== 'Closed'; }).length;
    var rsCrit = PPM.domain.risk.countCritical(rs);
    var dsRequired = ds.filter(function(d){ return d.applicability === 'Required'; }).length;
    var dsApproved = ds.filter(function(d){ return d.status === 'Approved'; }).length;
    var totalBudget = PPM.domain.budget.totalContracted(cs);
    var spentBudget = PPM.domain.budget.totalSpent(cs);
    var burnPct = totalBudget > 0 ? Math.round(spentBudget / totalBudget * 100) : 0;
    var daysToGoLive = state.meta.goLive ? PPM.domain.dates.daysBetween(today, state.meta.goLive) : null;

    var msWithRAG = ms.map(function(m){
      return Object.assign({}, m, { _rag: PPM.domain.scheduling.computeRAG(m, today) });
    });
    var statusOrder = { 'Blocked':0, 'Delayed':1, 'In Progress':2, 'Not Started':3, 'Complete':4 };
    var sortedMs = msWithRAG.slice().sort(function(a, b){
      return (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9);
    });
    var topRisks = rs.filter(function(r){ return r.status !== 'Closed'; })
      .sort(function(a, b){ return PPM.domain.risk.computeScore(b) - PPM.domain.risk.computeScore(a); })
      .slice(0, 5);

    return {
      health: PPM.domain.health.computeProjectHealth(state, today),
      kpis: {
        milestones: { done: msComplete, total: ms.length, pct: ms.length ? Math.round(msComplete/ms.length*100) : 0 },
        tasks:      { done: tsComplete, total: ts.length, pct: ts.length ? Math.round(tsComplete/ts.length*100) : 0 },
        risks:      { open: rsOpen, critical: rsCrit },
        budget:     { pct: burnPct, spent: spentBudget, total: totalBudget },
        documents:  { approved: dsApproved, required: dsRequired, pct: dsRequired ? Math.round(dsApproved/dsRequired*100) : 0 },
        goLive:     { days: daysToGoLive, date: state.meta.goLive }
      },
      milestoneProgress: sortedMs.slice(0, 10),
      topRisks: topRisks,
      vendorBurn: cs.map(function(c){
        return Object.assign({}, c, {
          _burnPct: PPM.domain.budget.computeBurn(c),
          _spent:   PPM.domain.budget.computeSpent(c)
        });
      })
    };
  }

  function buildSteerCoData(state){
    if(!state) return null;
    var today = PPM.domain.dates.today();
    var ms = state.milestones || [];
    var rs = state.risks || [];
    return {
      meta: state.meta,
      reportDate: today,
      health: PPM.domain.health.computeProjectHealth(state, today),
      completed:  ms.filter(function(m){ return m.status === 'Complete'; }),
      inProgress: ms.filter(function(m){ return m.status === 'In Progress'; }),
      upcoming:   ms.filter(function(m){ return m.status === 'Not Started'; }).slice(0, 6),
      keyRisks:   rs.filter(function(r){ return r.status !== 'Closed'; })
        .sort(function(a, b){ return PPM.domain.risk.computeScore(b) - PPM.domain.risk.computeScore(a); })
        .slice(0, 5),
      decisions: (state.steerco && state.steerco.decisions) || ['','','','']
    };
  }

  PPM.services.reportService = Object.freeze({
    buildDashboardData: buildDashboardData,
    buildSteerCoData:   buildSteerCoData
  });
})();
