/* ============================================================================
   File: src/ui/shell.js
   Dependencies: PPM.ui.icons, PPM.ui.router, PPM.ui.toast,
                 PPM.services.projectService, PPM.services.reportService,
                 PPM.services.viewService, PPM.events
   Exports: PPM.ui.shell.{render, refresh, hide}

   ARCHITECTURE: UI consumes services only. No direct domain or adapter access.
   Health/badges come from viewService. Export goes through projectService.
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};
  var icons = PPM.ui.icons;

  // Cache of last-rendered state to avoid unnecessary work
  var rendered = false;

  function render(){
    if(rendered){ refresh(); return; }
    var state = PPM.services.projectService.getState();
    if(!state){
      // No project — shell should not be visible
      hide();
      return;
    }

    // Hide welcome if it's open
    if(PPM.ui.welcome) PPM.ui.welcome.hide();

    var existing = document.getElementById('ppm-app');
    if(existing) existing.parentNode.removeChild(existing);

    var app = document.createElement('div');
    app.id = 'ppm-app';
    app.className = 'ppm-app';
    app.innerHTML =
      _renderTopBar(state) +
      '<div class="ppm-main">' +
        _renderSidebar(state) +
        '<section class="ppm-workspace">' +
          _renderContextBar(state) +
          '<div class="ppm-content" id="ppm-content">' + _renderEmptyView() + '</div>' +
        '</section>' +
      '</div>' +
      _renderStatusBar(state);

    document.body.appendChild(app);
    rendered = true;
    _wireUpEvents();
    _renderCurrentView();
  }

  function refresh(){
    var state = PPM.services.projectService.getState();
    if(!state){ hide(); return; }
    if(!rendered){ render(); return; }

    // Update parts that depend on state
    var topRight = document.getElementById('ppm-topbar-right');
    if(topRight){ topRight.innerHTML = _renderTopBarRightInner(state); _wireTopBarButtons(); }

    var topProject = document.getElementById('ppm-topbar-project');
    if(topProject){ topProject.innerHTML = _renderTopBarProjectInner(state); }

    var sidebarNav = document.getElementById('ppm-sidebar-nav');
    if(sidebarNav){ sidebarNav.innerHTML = _renderSidebarNavInner(state); _wireSidebarNav(); }

    var statusBar = document.getElementById('ppm-statusbar');
    if(statusBar){ statusBar.innerHTML = _renderStatusBarInner(state); _wireStatusBar(); }

    var contextBar = document.getElementById('ppm-contextbar');
    if(contextBar){ contextBar.innerHTML = _renderContextBarInner(state); }
  }

  function hide(){
    var app = document.getElementById('ppm-app');
    if(app && app.parentNode){ app.parentNode.removeChild(app); }
    rendered = false;
  }

  // -------------------------------------------------------------------------
  // TOP BAR
  // -------------------------------------------------------------------------
  function _renderTopBar(state){
    return '<header class="ppm-topbar">' +
      '<button class="ppm-hamburger" id="ppm-hamburger" aria-label="Toggle menu">' + icons.menu() + '</button>' +
      '<div class="ppm-topbar-brand">' +
        '<span class="ppm-brand-mark">P</span>' +
        'PharmaPM <span class="ppm-brand-mark-light">Pro</span>' +
      '</div>' +
      '<div class="ppm-topbar-sep"></div>' +
      '<div class="ppm-topbar-project" id="ppm-topbar-project">' + _renderTopBarProjectInner(state) + '</div>' +
      '<div class="ppm-topbar-right" id="ppm-topbar-right">' + _renderTopBarRightInner(state) + '</div>' +
    '</header>';
  }

  function _renderTopBarProjectInner(state){
    var demoTag = state.isDemo ? '<span class="ppm-demo-tag">DEMO</span>' : '';
    return '<div class="ppm-topbar-project-inner">' +
      '<div class="ppm-topbar-project-name">' + demoTag + _escape(state.meta.name || 'Untitled') + '</div>' +
      '<div class="ppm-topbar-project-meta">' + _escape(state.meta.system || '') + ' · ' + _escape(state.meta.methodology || '') + '</div>' +
    '</div>';
  }

  function _renderTopBarRightInner(state){
    var view = PPM.services.viewService;
    var health = view.computeProjectHealth(state);
    var goLive = state.meta.goLive;
    var daysToGoLive = goLive ? view.daysBetween(view.today(), goLive) : null;
    var countdownText = '';
    if(daysToGoLive != null){
      if(daysToGoLive >= 0) countdownText = '<strong>' + daysToGoLive + 'd</strong> to go-live';
      else countdownText = '<strong class="ppm-text-red">' + Math.abs(daysToGoLive) + 'd</strong> overdue';
    }

    return '<span class="ppm-health-pill ppm-health-' + health.level.toLowerCase() + '">' +
              '<span class="ppm-health-dot"></span>' + _escape(health.reason) +
            '</span>' +
            '<span class="ppm-countdown">' + countdownText + '</span>' +
            '<button class="ppm-btn-tool" id="ppm-btn-export" title="Export project as JSON">' +
              icons.download() + '<span class="ppm-btn-label">Export</span>' +
            '</button>';
  }

  // -------------------------------------------------------------------------
  // SIDEBAR
  // -------------------------------------------------------------------------
  function _renderSidebar(state){
    return '<aside class="ppm-sidebar" id="ppm-sidebar">' +
      '<div class="ppm-sidebar-header">' +
        '<div class="ppm-sidebar-project-name">' + _escape(state.meta.name || 'Untitled') + '</div>' +
        '<div class="ppm-sidebar-project-system">' + _escape(state.meta.system || '') + ' · ' + _escape(state.meta.methodology || '') + '</div>' +
      '</div>' +
      '<nav class="ppm-sidebar-nav" id="ppm-sidebar-nav">' + _renderSidebarNavInner(state) + '</nav>' +
      '<div class="ppm-sidebar-footer">' +
        '<button class="ppm-sidebar-footer-btn" id="ppm-btn-import">Import</button>' +
        '<button class="ppm-sidebar-footer-btn" id="ppm-btn-new">New</button>' +
      '</div>' +
    '</aside>';
  }

  function _renderSidebarNavInner(state){
    var badges = PPM.services.viewService.computeBadges(state);
    var currentView = PPM.ui.router.getView();

    var sections = [
      { group: 'Plan',    items: [{ v:'milestones', label:'Milestones', badge:badges.milestones }] },
      { group: 'Execute', items: [{ v:'tasks',      label:'Tasks',      badge:badges.tasks }] },
      { group: 'Control', items: [
          { v:'risks',     label:'Risks',     badge:badges.risks },
          { v:'documents', label:'Documents', badge:badges.documents },
          { v:'costs',     label:'Costs',     badge:badges.costs }
      ]},
      { group: 'Report',  items: [
          { v:'dashboard', label:'Dashboard',     badge:null },
          { v:'steerco',   label:'SteerCo',       badge:null }
      ]}
    ];

    var html = '';
    sections.forEach(function(sec){
      html += '<div class="ppm-nav-section">' + sec.group + '</div>';
      sec.items.forEach(function(item){
        var isActive = currentView === item.v;
        var iconHtml = (icons[item.v] || icons.folder)('ppm-nav-icon');
        var badgeHtml = '';
        if(item.badge && !item.badge.hidden){
          var levelClass = 'ppm-badge-' + item.badge.level;
          var badgeText = item.badge.label || item.badge.count || '';
          badgeHtml = '<span class="ppm-nav-badge ' + levelClass + '">' + _escape(String(badgeText)) + '</span>';
        }
        html += '<button class="ppm-nav-item' + (isActive ? ' ppm-nav-item-active' : '') + '" data-view="' + item.v + '">' +
                  iconHtml +
                  '<span class="ppm-nav-label">' + _escape(item.label) + '</span>' +
                  badgeHtml +
                '</button>';
      });
    });
    return html;
  }

  // -------------------------------------------------------------------------
  // CONTEXT BAR
  // -------------------------------------------------------------------------
  function _renderContextBar(state){
    return '<div class="ppm-contextbar" id="ppm-contextbar">' + _renderContextBarInner(state) + '</div>';
  }

  function _renderContextBarInner(state){
    var meta = PPM.ui.router.getViewMeta(PPM.ui.router.getView()) || {};
    return '<span class="ppm-breadcrumb">' + _escape(meta.group || '') + '<span class="ppm-breadcrumb-sep">›</span></span>' +
           '<span class="ppm-context-title">' + _escape(meta.label || '') + '</span>' +
           '<div class="ppm-context-spacer"></div>';
  }

  // -------------------------------------------------------------------------
  // STATUS BAR
  // -------------------------------------------------------------------------
  function _renderStatusBar(state){
    return '<footer class="ppm-statusbar" id="ppm-statusbar">' + _renderStatusBarInner(state) + '</footer>';
  }

  function _renderStatusBarInner(state){
    var ds = state.documents || [];
    var dsRequired = ds.filter(function(d){ return d.applicability === 'Required'; }).length;
    var dsApproved = ds.filter(function(d){ return d.status === 'Approved'; }).length;
    var lastSavedTs = window._ppmLastSaved || '';
    var savedLabel = lastSavedTs ? 'Saved ' + lastSavedTs.split('T')[1].slice(0, 5) : 'Saved';

    return '<span class="ppm-status-item"><span class="ppm-save-dot"></span>' + savedLabel + '</span>' +
           '<span class="ppm-status-sep"></span>' +
           '<span class="ppm-status-item">Browser Storage</span>' +
           '<span class="ppm-status-sep"></span>' +
           '<span class="ppm-status-item">Schema <strong>v' + _escape(state.schemaVersion) + '</strong></span>' +
           '<span class="ppm-status-sep"></span>' +
           '<span class="ppm-status-item"><strong>' + dsApproved + '/' + dsRequired + '</strong> docs ready</span>' +
           '<span class="ppm-status-spacer"></span>' +
           '<a class="ppm-status-link" id="ppm-btn-backup">Backup now</a>';
  }

  // -------------------------------------------------------------------------
  // CONTENT (placeholder until B3)
  // -------------------------------------------------------------------------
  function _renderEmptyView(){
    var view = PPM.ui.router.getView();
    var meta = PPM.ui.router.getViewMeta(view) || {};
    return '<div class="ppm-empty-view">' +
      '<div class="ppm-empty-icon">' + (icons[view] || icons.folder)('icon-lg') + '</div>' +
      '<div class="ppm-empty-title">' + _escape(meta.label || 'View') + '</div>' +
      '<div class="ppm-empty-desc">' +
        'This view will be populated in <strong>Session B3</strong>.<br>' +
        'For now, the shell, sidebar badges, health pill, and DEMO banner are wired up.' +
      '</div>' +
      '<div class="ppm-empty-meta">View id: <code>' + _escape(view) + '</code></div>' +
    '</div>';
  }

  function _renderCurrentView(){
    var content = document.getElementById('ppm-content');
    if(!content) return;
    var view = PPM.ui.router.getView();

    // B3a: render grid for grid-view types
    if(['milestones','tasks','risks','documents','costs'].indexOf(view) >= 0){
      if(PPM.ui.grid){
        PPM.ui.grid.render(view);
        return;
      }
    }

    // B3b: render dashboard / steerco
    if(view === 'dashboard' && PPM.ui.dashboard){
      PPM.ui.dashboard.render();
      return;
    }
    if(view === 'steerco' && PPM.ui.steerco){
      PPM.ui.steerco.render();
      return;
    }

    // Fallback (should be unreachable for known views)
    content.innerHTML = _renderEmptyView();
  }

  // -------------------------------------------------------------------------
  // EVENT WIRING
  // -------------------------------------------------------------------------
  function _wireUpEvents(){
    _wireTopBarButtons();
    _wireSidebarNav();
    _wireStatusBar();

    var hamburger = document.getElementById('ppm-hamburger');
    if(hamburger){
      hamburger.addEventListener('click', function(){
        var sb = document.getElementById('ppm-sidebar');
        if(sb) sb.classList.toggle('ppm-sidebar-open');
      });
    }

    var importBtn = document.getElementById('ppm-btn-import');
    if(importBtn){ importBtn.addEventListener('click', _handleImport); }

    var newBtn = document.getElementById('ppm-btn-new');
    if(newBtn){
      newBtn.addEventListener('click', function(){
        if(!confirm('Start a new project? Your current project will be replaced — export first if you want to keep it.')) return;
        PPM.services.projectService.reset();
      });
    }
  }

  function _wireTopBarButtons(){
    var exportBtn = document.getElementById('ppm-btn-export');
    if(exportBtn){
      exportBtn.addEventListener('click', _handleExport);
    }
  }

  function _wireSidebarNav(){
    var navItems = document.querySelectorAll('.ppm-nav-item');
    navItems.forEach(function(item){
      item.addEventListener('click', function(){
        var view = item.getAttribute('data-view');
        if(view){
          PPM.ui.router.navigate(view);
          // Close mobile sidebar
          var sb = document.getElementById('ppm-sidebar');
          if(sb) sb.classList.remove('ppm-sidebar-open');
        }
      });
    });
  }

  function _wireStatusBar(){
    var backupBtn = document.getElementById('ppm-btn-backup');
    if(backupBtn) backupBtn.addEventListener('click', _handleExport);
  }

  function _handleExport(){
    var state = PPM.services.projectService.getState();
    if(!state){ PPM.ui.toast.show('No project to export', 'error'); return; }
    if(state.isDemo){
      if(!confirm('You are exporting demo data, not a real project. Continue?')) return;
    }
    // ARCHITECTURE: UI calls service. Service wraps the exporter adapter.
    var result = PPM.services.projectService.exportToFile();
    if(result.ok){
      PPM.ui.toast.show('Project exported', 'success');
    } else {
      PPM.ui.toast.show('Export failed: ' + result.error, 'error', 4000);
    }
  }

  function _handleImport(){
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', function(e){
      var file = e.target.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = function(ev){
        var result = PPM.services.projectService.importFromJSON(ev.target.result);
        if(result.ok) PPM.ui.toast.show('Project imported', 'success');
        else PPM.ui.toast.show('Import failed: ' + result.error, 'error', 4000);
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function _escape(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // -------------------------------------------------------------------------
  // EVENT SUBSCRIPTIONS
  // -------------------------------------------------------------------------
  PPM.events.on('state:changed', refresh);
  PPM.events.on('project:created', render);
  PPM.events.on('project:loaded', render);
  PPM.events.on('project:imported', render);
  PPM.events.on('project:demo_loaded', render);
  PPM.events.on('project:reset', hide);
  PPM.events.on('lifecycle:changed', refresh);
  PPM.events.on('ui:view_changed', function(){ _renderCurrentView(); refresh(); });
  PPM.events.on('storage:saved', function(ts){
    window._ppmLastSaved = ts;
    var sb = document.getElementById('ppm-statusbar');
    if(sb) sb.innerHTML = _renderStatusBarInner(PPM.services.projectService.getState());
    _wireStatusBar();
  });
  PPM.events.on('ui:export_request', _handleExport);

  PPM.ui.shell = Object.freeze({
    render:  render,
    refresh: refresh,
    hide:    hide
  });
})();
