/* ============================================================================
   File: src/domain/health.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.domain.health
   Dependencies: PPM.domain.scheduling, PPM.domain.risk, PPM.domain.dates
   ============================================================================ */
(function(){
  var dates = PPM.domain.dates;
  var scheduling = PPM.domain.scheduling;
  var risk = PPM.domain.risk;

  function computeProjectHealth(state, todayStr){
    var today = todayStr || dates.today();
    var ms = state.milestones || [];
    var rs = state.risks || [];
    var blocked = ms.filter(function(m){ return m.status === 'Blocked'; }).length;
    var delayed = ms.filter(function(m){
      return scheduling.computeRAG(m, today) === 'Red' && m.status !== 'Blocked' && m.status !== 'Complete';
    }).length;
    var amber = ms.filter(function(m){ return scheduling.computeRAG(m, today) === 'Amber'; }).length;
    var crit = risk.countCritical(rs);

    if(blocked > 0) return { level:'Red', reason: blocked + ' blocked' };
    if(delayed > 0) return { level:'Red', reason: delayed + ' delayed' };
    if(crit > 0)    return { level:'Red', reason: crit + ' critical risk' + (crit > 1 ? 's' : '') };
    if(amber > 0)   return { level:'Amber', reason: amber + ' at risk' };
    return { level:'Green', reason: 'On track' };
  }

  function computeBadges(state, todayStr){
    var today = todayStr || dates.today();
    var ms = state.milestones || [];
    var ts = state.tasks || [];
    var rs = state.risks || [];
    var ds = state.documents || [];
    var cs = state.costs || [];
    var cfgRisk = PPM.config.rules.risk;
    var cfgBurn = PPM.config.rules.burn;

    // Milestones
    var msComplete = ms.filter(function(m){ return m.status === 'Complete'; }).length;
    var msBlocked = ms.filter(function(m){ return m.status === 'Blocked'; }).length;
    var msDelayed = ms.filter(function(m){
      var rag = scheduling.computeRAG(m, today);
      return rag === 'Red' && m.status !== 'Blocked' && m.status !== 'Complete';
    }).length;
    var msAmber = ms.filter(function(m){ return scheduling.computeRAG(m, today) === 'Amber'; }).length;
    var milestonesBadge;
    if(ms.length === 0){
      milestonesBadge = { count: 0, hidden: true, level: 'neutral' };
    } else if(msBlocked > 0 || msDelayed > 0){
      milestonesBadge = { count: msBlocked + msDelayed, label: (msBlocked + msDelayed) + ' exception', hidden: false, level: 'red' };
    } else if(msAmber > 0){
      milestonesBadge = { count: msAmber, label: msAmber + ' at risk', hidden: false, level: 'amber' };
    } else {
      milestonesBadge = { count: msComplete + '/' + ms.length, hidden: false, level: 'neutral' };
    }

    // Tasks
    var tsComplete = ts.filter(function(t){ return t.status === 'Complete'; }).length;
    var tsBlocked = ts.filter(function(t){ return t.status === 'Blocked'; }).length;
    var tsOverdue = ts.filter(function(t){
      return t.status !== 'Complete' && t.plannedEnd && dates.compare(t.plannedEnd, today) < 0;
    }).length;
    var tasksBadge;
    if(ts.length === 0){
      tasksBadge = { count: 0, hidden: true, level: 'neutral' };
    } else if(tsBlocked > 0){
      tasksBadge = { count: tsBlocked, label: tsBlocked + ' blocked', hidden: false, level: 'red' };
    } else if(tsOverdue > 0){
      tasksBadge = { count: tsOverdue, label: tsOverdue + ' overdue', hidden: false, level: 'amber' };
    } else {
      tasksBadge = { count: tsComplete + '/' + ts.length, hidden: false, level: 'neutral' };
    }

    // Risks
    var rsOpen = rs.filter(function(r){ return r.status !== 'Closed'; }).length;
    var rsCrit = rs.filter(function(r){
      return risk.computeScore(r) >= cfgRisk.highScore && r.status !== 'Closed';
    }).length;
    var rsMed = rs.filter(function(r){
      var s = risk.computeScore(r);
      return s >= cfgRisk.mediumScore && s < cfgRisk.highScore && r.status !== 'Closed';
    }).length;
    var risksBadge;
    if(rs.length === 0){
      risksBadge = { count: 0, hidden: true, level: 'neutral' };
    } else if(rsCrit > 0){
      risksBadge = { count: rsCrit, label: rsCrit + ' critical', hidden: false, level: 'red' };
    } else if(rsMed > 0){
      risksBadge = { count: rsMed, label: rsMed + ' medium', hidden: false, level: 'amber' };
    } else {
      risksBadge = { count: rsOpen, hidden: false, level: 'neutral' };
    }

    // Documents
    var dsRequired = ds.filter(function(d){ return d.applicability === 'Required'; }).length;
    var dsApproved = ds.filter(function(d){ return d.status === 'Approved'; }).length;
    var dsOverdue = ds.filter(function(d){
      return d.applicability === 'Required' && d.status !== 'Approved' && d.targetDate && dates.compare(d.targetDate, today) < 0;
    }).length;
    var goLive = (state.meta && state.meta.goLive) || '';
    var daysToGoLive = goLive ? dates.daysBetween(today, goLive) : 999;
    var underHalfNear = dsRequired > 0 && (dsApproved / dsRequired < 0.5) && daysToGoLive < 30 && daysToGoLive > 0;
    var documentsBadge;
    if(ds.length === 0){
      documentsBadge = { count: 0, hidden: true, level: 'neutral' };
    } else if(dsOverdue > 0){
      documentsBadge = { count: dsOverdue, label: dsOverdue + ' overdue', hidden: false, level: 'red' };
    } else if(underHalfNear){
      documentsBadge = { count: dsApproved + '/' + dsRequired, label: 'behind', hidden: false, level: 'amber' };
    } else {
      documentsBadge = { count: dsApproved + '/' + dsRequired, hidden: false, level: 'neutral' };
    }

    // Costs
    var totalH = cs.reduce(function(s, c){ return s + (parseInt(c.hours) || 0); }, 0);
    var usedH = cs.reduce(function(s, c){ return s + (parseInt(c.used) || 0); }, 0);
    var burnPct = totalH > 0 ? Math.round(usedH / totalH * 100) : 0;
    var costsBadge;
    if(cs.length === 0){
      costsBadge = { count: 0, hidden: true, level: 'neutral' };
    } else if(burnPct > cfgBurn.redPct){
      costsBadge = { count: burnPct + '%', label: 'over budget', hidden: false, level: 'red' };
    } else if(burnPct > cfgBurn.amberPct){
      costsBadge = { count: burnPct + '%', hidden: false, level: 'amber' };
    } else {
      costsBadge = { count: burnPct + '%', hidden: false, level: 'neutral' };
    }

    return {
      milestones: milestonesBadge,
      tasks:      tasksBadge,
      risks:      risksBadge,
      documents:  documentsBadge,
      costs:      costsBadge
    };
  }

  PPM.domain.health = Object.freeze({
    computeProjectHealth: computeProjectHealth,
    computeBadges:        computeBadges
  });
})();
