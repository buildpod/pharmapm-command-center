/* ============================================================================
   File: src/ui/dashboard.js
   Dependencies: PPM.ui.icons, PPM.services.projectService,
                 PPM.services.reportService, PPM.services.viewService,
                 PPM.events
   Exports: PPM.ui.dashboard.{render, refresh}

   ARCHITECTURE: UI consumes services only. No direct domain or adapter access.

   What this renders:
   - 6 KPI cards: Milestones, Tasks, Risks, Budget, Documents, Go-Live
   - Milestone progress strip (top 10, exception-first)
   - Top risks panel (top 5 by score)
   - Vendor burn table
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};
  var icons = PPM.ui.icons;

  function render(){
    var content = document.getElementById('ppm-content');
    if(!content) return;
    var state = PPM.services.projectService.getState();
    if(!state) return;

    var data = PPM.services.reportService.buildDashboardData(state);
    if(!data){
      content.innerHTML = '<div class="ppm-empty-view"><div class="ppm-empty-title">No project loaded</div></div>';
      return;
    }

    content.innerHTML = '<div class="ppm-dashboard">' +
      _renderKPIs(data) +
      '<div class="ppm-dashboard-grid">' +
        _renderMilestoneProgress(data) +
        _renderTopRisks(data) +
      '</div>' +
      _renderVendorBurn(data) +
    '</div>';
  }

  function refresh(){
    if(PPM.ui.router.getView() === 'dashboard') render();
  }

  // -------------------------------------------------------------------------
  // KPI CARDS
  // -------------------------------------------------------------------------
  function _renderKPIs(data){
    var k = data.kpis;
    var healthLevel = (data.health && data.health.level) ? data.health.level.toLowerCase() : 'green';

    var goLiveValue, goLiveSub;
    if(k.goLive.days == null){
      goLiveValue = '—';
      goLiveSub = 'No date set';
    } else if(k.goLive.days >= 0){
      goLiveValue = k.goLive.days + 'd';
      goLiveSub = 'until go-live';
    } else {
      goLiveValue = Math.abs(k.goLive.days) + 'd';
      goLiveSub = 'past go-live';
    }
    var goLiveAccent = k.goLive.days != null && k.goLive.days < 0 ? 'red' :
                       (k.goLive.days != null && k.goLive.days < 30 ? 'amber' : 'green');

    var risksAccent = k.risks.critical > 0 ? 'red' : (k.risks.open > 0 ? 'amber' : 'green');
    var budgetAccent = k.budget.pct > 100 ? 'red' : (k.budget.pct > 85 ? 'amber' : 'green');

    return '<div class="ppm-kpi-row">' +
      _kpiCard('Health', healthLevel.toUpperCase(), data.health.reason, healthLevel) +
      _kpiCard('Milestones', k.milestones.done + '/' + k.milestones.total, k.milestones.pct + '% complete', null, k.milestones.pct) +
      _kpiCard('Tasks', k.tasks.done + '/' + k.tasks.total, k.tasks.pct + '% complete', null, k.tasks.pct) +
      _kpiCard('Open Risks', String(k.risks.open), k.risks.critical + ' critical', risksAccent) +
      _kpiCard('Budget', k.budget.pct + '%', '€' + Number(k.budget.spent).toLocaleString() + ' / €' + Number(k.budget.total).toLocaleString(), budgetAccent, Math.min(k.budget.pct, 100)) +
      _kpiCard('Go-Live', goLiveValue, goLiveSub, goLiveAccent) +
    '</div>';
  }

  function _kpiCard(label, value, sub, accent, pct){
    var accentClass = accent ? ' ppm-kpi-accent-' + accent : '';
    var bar = '';
    if(pct != null){
      bar = '<div class="ppm-kpi-bar"><div class="ppm-kpi-bar-fill" style="width:' + Math.max(0, Math.min(100, pct)) + '%"></div></div>';
    }
    return '<div class="ppm-kpi-card' + accentClass + '">' +
      '<div class="ppm-kpi-label">' + _esc(label) + '</div>' +
      '<div class="ppm-kpi-value">' + _esc(value) + '</div>' +
      '<div class="ppm-kpi-sub">' + _esc(sub) + '</div>' +
      bar +
    '</div>';
  }

  // -------------------------------------------------------------------------
  // MILESTONE PROGRESS
  // -------------------------------------------------------------------------
  function _renderMilestoneProgress(data){
    var rows = data.milestoneProgress || [];
    if(rows.length === 0){
      return '<div class="ppm-card">' +
        '<div class="ppm-card-header"><h3 class="ppm-card-title">Milestone Progress</h3></div>' +
        '<div class="ppm-card-empty">No milestones yet.</div>' +
      '</div>';
    }

    var rowsHtml = rows.map(function(m){
      // Normalize RAG casing for CSS class (reportService returns 'Green'/'Amber'/'Red')
      var rag = String(m._rag || 'Green').toLowerCase();
      var pct = parseInt(m.pct) || 0;
      var statusKey = String(m.status || '').toLowerCase().replace(/\s+/g, '-');

      return '<div class="ppm-mp-row" data-milestone-id="' + m.id + '">' +
        '<div class="ppm-mp-rag ppm-mp-rag-' + rag + '"></div>' +
        '<div class="ppm-mp-info">' +
          '<div class="ppm-mp-name">' + _esc(m.name) + '</div>' +
          '<div class="ppm-mp-meta">' + _esc(m.phase || '') + (m.owner ? ' · ' + _esc(m.owner) : '') + '</div>' +
        '</div>' +
        '<div class="ppm-mp-bar">' +
          '<div class="ppm-mp-bar-fill ppm-mp-bar-' + rag + '" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<div class="ppm-mp-pct ppm-num">' + pct + '%</div>' +
        '<span class="ppm-status-badge ppm-status-' + statusKey + '">' + _esc(m.status) + '</span>' +
      '</div>';
    }).join('');

    return '<div class="ppm-card">' +
      '<div class="ppm-card-header">' +
        '<h3 class="ppm-card-title">Milestone Progress</h3>' +
        '<span class="ppm-card-meta">Top ' + rows.length + ', exception-first</span>' +
      '</div>' +
      '<div class="ppm-mp-list">' + rowsHtml + '</div>' +
    '</div>';
  }

  // -------------------------------------------------------------------------
  // TOP RISKS
  // -------------------------------------------------------------------------
  function _renderTopRisks(data){
    var rows = data.topRisks || [];
    if(rows.length === 0){
      return '<div class="ppm-card">' +
        '<div class="ppm-card-header"><h3 class="ppm-card-title">Top Risks</h3></div>' +
        '<div class="ppm-card-empty">No open risks.</div>' +
      '</div>';
    }

    var rowsHtml = rows.map(function(r){
      // Use viewService to derive score and band consistently
      var enriched = PPM.services.viewService.enrichRow('risks', r);
      var statusKey = String(r.status || '').toLowerCase().replace(/\s+/g, '-');
      return '<div class="ppm-tr-row" data-risk-id="' + r.id + '">' +
        '<span class="ppm-status-badge ppm-status-' + enriched._scoreBand + '">' + enriched._score + '</span>' +
        '<div class="ppm-tr-info">' +
          '<div class="ppm-tr-desc">' + _esc(r.desc || '') + '</div>' +
          '<div class="ppm-tr-meta">' + _esc(r.category || '') + (r.owner ? ' · ' + _esc(r.owner) : '') + '</div>' +
        '</div>' +
        '<span class="ppm-status-badge ppm-status-' + statusKey + '">' + _esc(r.status) + '</span>' +
      '</div>';
    }).join('');

    return '<div class="ppm-card">' +
      '<div class="ppm-card-header">' +
        '<h3 class="ppm-card-title">Top Risks</h3>' +
        '<span class="ppm-card-meta">Highest score first</span>' +
      '</div>' +
      '<div class="ppm-tr-list">' + rowsHtml + '</div>' +
    '</div>';
  }

  // -------------------------------------------------------------------------
  // VENDOR BURN
  // -------------------------------------------------------------------------
  function _renderVendorBurn(data){
    var rows = data.vendorBurn || [];
    if(rows.length === 0){
      return '<div class="ppm-card">' +
        '<div class="ppm-card-header"><h3 class="ppm-card-title">Vendor Burn</h3></div>' +
        '<div class="ppm-card-empty">No vendors yet.</div>' +
      '</div>';
    }

    var rowsHtml = rows.map(function(c){
      // Lowercase via viewService for consistent CSS classes
      var enriched = PPM.services.viewService.enrichRow('costs', c);
      var burnPct = c._burnPct != null ? c._burnPct : enriched._burn;
      var spent   = c._spent   != null ? c._spent   : enriched._cost;
      var totalContract = (parseFloat(c.hours) || 0) * (parseFloat(c.rate) || 0);
      var rag = enriched._budgetRag;

      return '<div class="ppm-vb-row">' +
        '<div class="ppm-vb-vendor">' +
          '<div class="ppm-vb-name">' + _esc(c.vendor) + '</div>' +
          '<div class="ppm-vb-type">' + _esc(c.type) + ' · ' + _esc(c.contract) + '</div>' +
        '</div>' +
        '<div class="ppm-vb-bar">' +
          '<div class="ppm-vb-bar-fill ppm-vb-bar-' + rag + '" style="width:' + Math.min(burnPct, 100) + '%"></div>' +
        '</div>' +
        '<div class="ppm-vb-pct ppm-num">' + burnPct + '%</div>' +
        '<div class="ppm-vb-amounts ppm-num">€' + Number(spent).toLocaleString() + ' <span class="ppm-vb-of">/ €' + Number(totalContract).toLocaleString() + '</span></div>' +
      '</div>';
    }).join('');

    return '<div class="ppm-card">' +
      '<div class="ppm-card-header">' +
        '<h3 class="ppm-card-title">Vendor Burn</h3>' +
        '<span class="ppm-card-meta">' + rows.length + ' vendors</span>' +
      '</div>' +
      '<div class="ppm-vb-list">' + rowsHtml + '</div>' +
    '</div>';
  }

  function _esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // -------------------------------------------------------------------------
  // EVENT SUBSCRIPTIONS
  // -------------------------------------------------------------------------
  PPM.events.on('ui:view_changed', function(payload){
    if(payload.to === 'dashboard') render();
  });
  PPM.events.on('state:changed', refresh);

  PPM.ui.dashboard = Object.freeze({
    render:  render,
    refresh: refresh
  });
})();
