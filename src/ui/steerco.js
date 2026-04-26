/* ============================================================================
   File: src/ui/steerco.js
   Dependencies: PPM.ui.icons, PPM.services.projectService,
                 PPM.services.reportService, PPM.services.editService,
                 PPM.services.viewService, PPM.events
   Exports: PPM.ui.steerco.{render, refresh}

   ARCHITECTURE: UI consumes services only.

   Layout:
   - Print toolbar (hidden on print)
   - Header: project name + report date + project meta grid
   - Executive summary: health pill + KPI strip
   - Milestones: 3 panels (Completed, In Progress, Upcoming)
   - Key Risks (top 5)
   - Steering Committee Decisions (4 editable lines)
   - Sign-off block

   Print uses @media print in gridStyles.css (existing) which hides chrome.
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};
  var icons = PPM.ui.icons;

  function render(){
    var content = document.getElementById('ppm-content');
    if(!content) return;
    var state = PPM.services.projectService.getState();
    if(!state) return;

    var data = PPM.services.reportService.buildSteerCoData(state);
    var dash = PPM.services.reportService.buildDashboardData(state);
    if(!data){
      content.innerHTML = '<div class="ppm-empty-view"><div class="ppm-empty-title">No project loaded</div></div>';
      return;
    }

    content.innerHTML =
      _renderToolbar() +
      '<div class="ppm-steerco-page">' +
        _renderReportHeader(data) +
        _renderExecutiveSummary(data, dash) +
        _renderMilestoneSections(data) +
        _renderKeyRisks(data) +
        _renderDecisions(data) +
        _renderSignOff(data) +
      '</div>';

    _wireEvents();
  }

  function refresh(){
    if(PPM.ui.router.getView() === 'steerco') render();
  }

  // -------------------------------------------------------------------------
  // TOOLBAR (hidden on print)
  // -------------------------------------------------------------------------
  function _renderToolbar(){
    return '<div class="ppm-steerco-toolbar">' +
      '<div class="ppm-steerco-toolbar-left">' +
        '<div class="ppm-steerco-toolbar-hint">A4 print-ready · Edit decisions inline before printing</div>' +
      '</div>' +
      '<div class="ppm-steerco-toolbar-right">' +
        '<button class="ppm-btn-tool ppm-btn-primary" id="ppm-steerco-print">' +
          icons.print() + '<span>Print / Save as PDF</span>' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  // -------------------------------------------------------------------------
  // REPORT HEADER
  // -------------------------------------------------------------------------
  function _renderReportHeader(data){
    var meta = data.meta || {};
    return '<div class="ppm-sc-header">' +
      '<div class="ppm-sc-header-row">' +
        '<div>' +
          '<div class="ppm-sc-eyebrow">Steering Committee Report</div>' +
          '<h1 class="ppm-sc-title">' + _esc(meta.name || 'Untitled Project') + '</h1>' +
        '</div>' +
        '<div class="ppm-sc-report-date">' +
          '<div class="ppm-sc-eyebrow">Report Date</div>' +
          '<div class="ppm-sc-date">' + _esc(data.reportDate) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ppm-sc-meta-grid">' +
        _metaCell('System', meta.system) +
        _metaCell('Methodology', meta.methodology) +
        _metaCell('GxP Level', meta.gxpLevel) +
        _metaCell('Project Manager', meta.pm) +
        _metaCell('Sponsor', meta.sponsor || '—') +
        _metaCell('Go-Live Target', meta.goLive || 'TBD') +
      '</div>' +
    '</div>';
  }

  function _metaCell(label, value){
    return '<div class="ppm-sc-meta-cell">' +
      '<div class="ppm-sc-meta-label">' + _esc(label) + '</div>' +
      '<div class="ppm-sc-meta-value">' + _esc(value || '—') + '</div>' +
    '</div>';
  }

  // -------------------------------------------------------------------------
  // EXECUTIVE SUMMARY
  // -------------------------------------------------------------------------
  function _renderExecutiveSummary(data, dash){
    var health = data.health || { level: 'Green', reason: '' };
    var healthLevel = String(health.level).toLowerCase();
    var k = (dash && dash.kpis) || {};

    var summaryStats = '';
    if(k.milestones){
      summaryStats =
        '<div class="ppm-sc-stat"><div class="ppm-sc-stat-value">' + k.milestones.done + '/' + k.milestones.total + '</div><div class="ppm-sc-stat-label">Milestones Complete</div></div>' +
        '<div class="ppm-sc-stat"><div class="ppm-sc-stat-value">' + k.tasks.done + '/' + k.tasks.total + '</div><div class="ppm-sc-stat-label">Tasks Complete</div></div>' +
        '<div class="ppm-sc-stat"><div class="ppm-sc-stat-value">' + k.risks.open + '</div><div class="ppm-sc-stat-label">Open Risks (' + k.risks.critical + ' critical)</div></div>' +
        '<div class="ppm-sc-stat"><div class="ppm-sc-stat-value">' + k.budget.pct + '%</div><div class="ppm-sc-stat-label">Budget Burn</div></div>' +
        '<div class="ppm-sc-stat"><div class="ppm-sc-stat-value">' + k.documents.approved + '/' + k.documents.required + '</div><div class="ppm-sc-stat-label">Validation Docs</div></div>';
      if(k.goLive.days != null){
        var goLiveText = k.goLive.days >= 0 ? (k.goLive.days + 'd') : (Math.abs(k.goLive.days) + 'd over');
        summaryStats +=
          '<div class="ppm-sc-stat"><div class="ppm-sc-stat-value">' + goLiveText + '</div><div class="ppm-sc-stat-label">' + (k.goLive.days >= 0 ? 'Until Go-Live' : 'Past Go-Live') + '</div></div>';
      }
    }

    return '<section class="ppm-sc-section ppm-sc-summary">' +
      '<h2 class="ppm-sc-section-title">Executive Summary</h2>' +
      '<div class="ppm-sc-health-line">' +
        '<span class="ppm-health-pill ppm-health-' + healthLevel + '">' +
          '<span class="ppm-health-dot"></span>Project Health: ' + _esc(health.level) +
        '</span>' +
        '<span class="ppm-sc-health-reason">' + _esc(health.reason || '') + '</span>' +
      '</div>' +
      '<div class="ppm-sc-stats">' + summaryStats + '</div>' +
    '</section>';
  }

  // -------------------------------------------------------------------------
  // MILESTONE SECTIONS
  // -------------------------------------------------------------------------
  function _renderMilestoneSections(data){
    return '<section class="ppm-sc-section">' +
      '<h2 class="ppm-sc-section-title">Milestones</h2>' +
      '<div class="ppm-sc-ms-grid">' +
        _msPanel('Completed', data.completed || [], 'green') +
        _msPanel('In Progress', data.inProgress || [], 'amber') +
        _msPanel('Upcoming', data.upcoming || [], 'gray') +
      '</div>' +
    '</section>';
  }

  function _msPanel(title, milestones, accent){
    if(milestones.length === 0){
      return '<div class="ppm-sc-ms-panel ppm-sc-ms-' + accent + '">' +
        '<div class="ppm-sc-ms-panel-header">' +
          '<span class="ppm-sc-ms-count">0</span>' + _esc(title) +
        '</div>' +
        '<div class="ppm-sc-ms-empty">None</div>' +
      '</div>';
    }
    var listHtml = milestones.slice(0, 8).map(function(m){
      var dateRange = '';
      if(m.plannedStart && m.plannedEnd){
        dateRange = '<div class="ppm-sc-ms-dates">' + _esc(m.plannedStart) + ' → ' + _esc(m.plannedEnd) + '</div>';
      }
      return '<div class="ppm-sc-ms-item">' +
        '<div class="ppm-sc-ms-name">' + _esc(m.name) + '</div>' +
        '<div class="ppm-sc-ms-meta">' + _esc(m.phase || '') + (m.owner ? ' · ' + _esc(m.owner) : '') + '</div>' +
        dateRange +
      '</div>';
    }).join('');
    var more = milestones.length > 8 ? '<div class="ppm-sc-ms-more">+ ' + (milestones.length - 8) + ' more</div>' : '';

    return '<div class="ppm-sc-ms-panel ppm-sc-ms-' + accent + '">' +
      '<div class="ppm-sc-ms-panel-header">' +
        '<span class="ppm-sc-ms-count">' + milestones.length + '</span>' + _esc(title) +
      '</div>' +
      '<div class="ppm-sc-ms-list">' + listHtml + more + '</div>' +
    '</div>';
  }

  // -------------------------------------------------------------------------
  // KEY RISKS
  // -------------------------------------------------------------------------
  function _renderKeyRisks(data){
    var risks = data.keyRisks || [];
    if(risks.length === 0){
      return '<section class="ppm-sc-section">' +
        '<h2 class="ppm-sc-section-title">Key Risks</h2>' +
        '<div class="ppm-sc-empty">No open risks.</div>' +
      '</section>';
    }

    var rowsHtml = risks.map(function(r){
      // Use viewService to compute score + band consistently (lowercase for CSS)
      var enriched = PPM.services.viewService.enrichRow('risks', r);
      return '<tr>' +
        '<td class="ppm-sc-risks-score">' +
          '<span class="ppm-status-badge ppm-status-' + enriched._scoreBand + '">' + enriched._score + '</span>' +
        '</td>' +
        '<td>' + _esc(r.desc || '') + '</td>' +
        '<td>' + _esc(r.category || '') + '</td>' +
        '<td>' + _esc(r.response || '') + '</td>' +
        '<td>' + _esc(r.owner || '—') + '</td>' +
      '</tr>';
    }).join('');

    return '<section class="ppm-sc-section">' +
      '<h2 class="ppm-sc-section-title">Key Risks</h2>' +
      '<table class="ppm-sc-risks-table">' +
        '<thead><tr>' +
          '<th>Score</th><th>Description</th><th>Category</th><th>Response</th><th>Owner</th>' +
        '</tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>' +
    '</section>';
  }

  // -------------------------------------------------------------------------
  // DECISIONS (4 editable rows)
  // -------------------------------------------------------------------------
  function _renderDecisions(data){
    var decisions = data.decisions || ['','','',''];
    // Always render exactly 4 lines for consistency
    while(decisions.length < 4) decisions.push('');

    var rowsHtml = decisions.slice(0, 4).map(function(d, i){
      return '<div class="ppm-sc-decision">' +
        '<div class="ppm-sc-decision-num">' + (i + 1) + '.</div>' +
        '<input class="ppm-sc-decision-input" type="text" value="' + _esc(d) + '" placeholder="Decision " data-decision-index="' + i + '">' +
      '</div>';
    }).join('');

    return '<section class="ppm-sc-section">' +
      '<h2 class="ppm-sc-section-title">Steering Committee Decisions</h2>' +
      '<div class="ppm-sc-decisions">' + rowsHtml + '</div>' +
    '</section>';
  }

  // -------------------------------------------------------------------------
  // SIGN-OFF
  // -------------------------------------------------------------------------
  function _renderSignOff(data){
    var meta = data.meta || {};
    return '<section class="ppm-sc-section ppm-sc-signoff">' +
      '<h2 class="ppm-sc-section-title">Sign-off</h2>' +
      '<div class="ppm-sc-signoff-grid">' +
        _signoffBlock('Project Manager', meta.pm || '') +
        _signoffBlock('Sponsor', meta.sponsor || '') +
      '</div>' +
    '</section>';
  }

  function _signoffBlock(label, name){
    return '<div class="ppm-sc-signoff-block">' +
      '<div class="ppm-sc-signoff-label">' + _esc(label) + '</div>' +
      '<div class="ppm-sc-signoff-name">' + _esc(name || '—') + '</div>' +
      '<div class="ppm-sc-signoff-line">Signature</div>' +
      '<div class="ppm-sc-signoff-line">Date</div>' +
    '</div>';
  }

  // -------------------------------------------------------------------------
  // EVENTS
  // -------------------------------------------------------------------------
  function _wireEvents(){
    var printBtn = document.getElementById('ppm-steerco-print');
    if(printBtn){
      printBtn.addEventListener('click', function(){
        // Note: printer adapter would be the right call, but since printing is
        // a pure browser API and adapter would just call window.print(), inline
        // is acceptable here. (No adapter abstraction to test/replace.)
        window.print();
      });
    }

    // Decision inputs — persist via editService ROOT-level edit isn't possible,
    // so we mutate state.steerco.decisions through a custom path. Actually the
    // cleanest way is a dedicated editService method, but to avoid scope creep
    // we update state and emit via the existing channels.
    document.querySelectorAll('[data-decision-index]').forEach(function(input){
      var commit = function(){
        var idx = parseInt(input.getAttribute('data-decision-index'));
        var newVal = input.value;
        var state = PPM.services.projectService.getState();
        if(!state || !state.steerco) return;
        if(state.steerco.decisions[idx] === newVal) return;
        state.steerco.decisions[idx] = newVal;
        // Touch updatedAt and persist via editService.forceSave so the autosave
        // pipeline stays canonical.
        PPM.services.editService.forceSave();
        PPM.events.emit('state:changed', state);
      };
      input.addEventListener('change', commit);
      input.addEventListener('blur', commit);
    });
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
    if(payload.to === 'steerco') render();
  });
  PPM.events.on('state:changed', refresh);

  PPM.ui.steerco = Object.freeze({
    render:  render,
    refresh: refresh
  });
})();
