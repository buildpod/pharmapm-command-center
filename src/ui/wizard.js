/* ============================================================================
   File: src/ui/wizard.js
   Dependencies: PPM.ui.icons, PPM.ui.toast, PPM.config,
                 PPM.services.projectService, PPM.services.viewService,
                 PPM.events
   Exports: PPM.ui.wizard.{open, close}
   Spec: PROD-002B_UserJourney_IA_v2.0 Section 2

   ARCHITECTURE: UI consumes services only. No direct domain or adapter access.
   Wizard previews and date helpers come from viewService.
   Validation comes from viewService (which proxies to domain).

   4 steps:
     1. Identity     (required: name, pm, system, methodology, goLive)
     2. Characteristics (conditional reveal on integrations count)
     3. Team & Vendors  (skippable)
     4. Review & Create (review-only, primary action commits)
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};
  var icons = PPM.ui.icons;

  // Wizard state. Reset each time wizard opens.
  var data = null;
  var step = 0;

  function _newData(){
    return {
      // Step 1
      name: '', projectId: '', pm: '', sponsor: '',
      system: 'Veeva RIM',
      methodology: 'Hybrid (V-Model + Agile)',
      goLive: '',
      // Step 2
      gxpLevel: 'High',
      migration: false,
      integrations: false,
      integrationCount: 0,
      decommissioning: false,
      vendorPkg: 'Partial',
      // Step 3
      team: [{ name: '', role: 'PM' }],
      vendors: [{ name: '', type: 'Implementation', hours: 200, rate: 150 }]
    };
  }

  // -------------------------------------------------------------------------
  // PUBLIC API
  // -------------------------------------------------------------------------
  function open(){
    data = _newData();
    step = 1;
    _render();
  }

  function close(){
    var w = document.getElementById('ppm-wizard');
    if(w && w.parentNode) w.parentNode.removeChild(w);
    data = null;
    step = 0;
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  function _render(){
    var existing = document.getElementById('ppm-wizard');
    if(existing) existing.parentNode.removeChild(existing);

    var overlay = document.createElement('div');
    overlay.id = 'ppm-wizard';
    overlay.className = 'ppm-wizard';

    overlay.innerHTML =
      _renderHeader() +
      '<div class="ppm-wizard-body" id="ppm-wizard-body">' +
        _renderStep() +
      '</div>' +
      _renderFooter();

    document.body.appendChild(overlay);
    _wireFooter();
    _wireStepInputs();
  }

  function _renderHeader(){
    var stepHtml = '';
    for(var i = 1; i <= 4; i++){
      var cls = 'ppm-wizard-step';
      if(i < step) cls += ' ppm-wizard-step-complete';
      else if(i === step) cls += ' ppm-wizard-step-active';
      stepHtml += '<div class="' + cls + '"></div>';
    }

    return '<div class="ppm-wizard-header">' +
      '<div class="ppm-wizard-brand">' +
        '<span class="ppm-brand-mark">P</span>' +
        '<span>PharmaPM <span class="ppm-brand-mark-light">Pro</span></span>' +
      '</div>' +
      '<div class="ppm-wizard-steps">' + stepHtml + '</div>' +
      '<div style="width:120px;display:flex;justify-content:flex-end">' +
        '<button class="ppm-btn-tool" id="ppm-wizard-cancel">Cancel</button>' +
      '</div>' +
    '</div>';
  }

  function _renderFooter(){
    var backDisabled = step === 1;
    var nextLabel, nextIcon;
    if(step === 4){ nextLabel = 'Create Project'; nextIcon = icons.check(); }
    else { nextLabel = 'Continue'; nextIcon = icons.arrowRight(); }

    var skipBtn = '';
    if(step === 3){
      skipBtn = '<button class="ppm-btn-tool" id="ppm-wizard-skip" style="margin-right:8px">Skip — add later</button>';
    }

    return '<div class="ppm-wizard-footer">' +
      '<button class="ppm-btn-tool" id="ppm-wizard-back" ' + (backDisabled ? 'disabled' : '') + '>' +
        icons.arrowLeft() + '<span>Back</span>' +
      '</button>' +
      '<div style="display:flex">' +
        skipBtn +
        '<button class="ppm-btn-tool ppm-btn-primary" id="ppm-wizard-next">' +
          '<span>' + nextLabel + '</span>' + nextIcon +
        '</button>' +
      '</div>' +
    '</div>';
  }

  function _renderStep(){
    if(step === 1) return _renderStep1();
    if(step === 2) return _renderStep2();
    if(step === 3) return _renderStep3();
    if(step === 4) return _renderStep4();
    return '';
  }

  // -------------------------------------------------------------------------
  // STEP 1: Identity
  // -------------------------------------------------------------------------
  function _renderStep1(){
    var systems = Object.keys(PPM.config.rules.methodologies); // wait — this is wrong, want SYSTEMS not methodologies
    // We don't have a SYSTEMS list in config. Hardcode here for now (matches the v1 single-file behavior).
    var systemList = [
      { name:'Veeva RIM', cat:'GxP Validated' },
      { name:'Veeva Vault QMS', cat:'GxP Validated' },
      { name:'Veeva Vault Safety', cat:'GxP Validated' },
      { name:'Veeva Vault Clinical (eTMF)', cat:'Qualified Platform' },
      { name:'Veeva CTMS', cat:'Qualified Platform' },
      { name:'SAP S/4HANA (non-GxP)', cat:'Non-GxP' },
      { name:'Custom / Other', cat:'Custom' }
    ];
    var methodologies = PPM.services.viewService.listMethodologies();

    var sysOpts = systemList.map(function(s){
      return '<option value="' + _esc(s.name) + '"' + (data.system === s.name ? ' selected' : '') + '>' +
        _esc(s.name) + ' — ' + _esc(s.cat) + '</option>';
    }).join('');

    var methOpts = methodologies.map(function(m){
      return '<option value="' + _esc(m) + '"' + (data.methodology === m ? ' selected' : '') + '>' +
        _esc(m) + '</option>';
    }).join('');

    return '<div class="ppm-wizard-container">' +
      '<div class="ppm-wizard-step-label">Step 1 of 4</div>' +
      '<h1 class="ppm-wizard-title">Project basics</h1>' +
      '<p class="ppm-wizard-desc">Tell us about your project. We use this to configure your workspace and pre-populate pharma-specific templates.</p>' +

      '<div class="ppm-wizard-card">' +
        _field('Project name', '*', 'text', 'name', data.name, 'e.g. Project Helix — Veeva RIM Implementation') +
        _row(
          _field('Project ID', '', 'text', 'projectId', data.projectId, 'PRJ-2026-001'),
          _field('Project manager', '*', 'text', 'pm', data.pm, 'Your name')
        ) +
        _field('Sponsor', '', 'text', 'sponsor', data.sponsor, 'Executive sponsor name') +
      '</div>' +

      '<div class="ppm-wizard-card">' +
        '<div class="ppm-wizard-field">' +
          '<label class="ppm-wizard-label">System being implemented<span class="ppm-required">*</span></label>' +
          '<select class="ppm-wizard-select" data-field="system">' + sysOpts + '</select>' +
          '<div class="ppm-wizard-help">Modules and document templates auto-populate based on your selection.</div>' +
        '</div>' +
        '<div class="ppm-wizard-field">' +
          '<label class="ppm-wizard-label">Methodology<span class="ppm-required">*</span></label>' +
          '<select class="ppm-wizard-select" data-field="methodology">' + methOpts + '</select>' +
          '<div class="ppm-wizard-help">Milestones and phase gates pre-configure to match this methodology.</div>' +
        '</div>' +
        _field('Go-Live target', '*', 'date', 'goLive', data.goLive, '') +
      '</div>' +
    '</div>';
  }

  // -------------------------------------------------------------------------
  // STEP 2: Characteristics (with conditional reveal)
  // -------------------------------------------------------------------------
  function _renderStep2(){
    var gxpToggle = _segToggle('gxpLevel', data.gxpLevel, ['High','Medium','Low','N/A']);
    var migToggle = _segToggle('migration', data.migration === true ? 'Yes' : 'No', ['Yes','No'], true);
    var intToggle = _segToggle('integrations', data.integrations === true ? 'Yes' : 'No', ['Yes','No'], true);
    var decToggle = _segToggle('decommissioning', data.decommissioning === true ? 'Yes' : 'No', ['Yes','No'], true);
    var vpToggle = _segToggle('vendorPkg', data.vendorPkg, ['Yes','Partial','No']);

    var integrationsReveal = '';
    if(data.integrations){
      integrationsReveal =
        '<div class="ppm-wizard-conditional">' +
          '<label class="ppm-wizard-label">How many integrations?</label>' +
          '<input class="ppm-wizard-input" type="number" min="1" max="20" ' +
            'value="' + (data.integrationCount || 1) + '" data-field="integrationCount" style="max-width:120px">' +
        '</div>';
    }

    return '<div class="ppm-wizard-container">' +
      '<div class="ppm-wizard-step-label">Step 2 of 4</div>' +
      '<h1 class="ppm-wizard-title">Project characteristics</h1>' +
      '<p class="ppm-wizard-desc">These choices drive the document checklist. We auto-generate the right validation deliverables based on what you select.</p>' +

      '<div class="ppm-wizard-card">' +
        _toggleRow('GxP impact level', 'High = full V-Model. Medium = combined FS/DS + OQ/PQ. Low = simplified qualification.', gxpToggle) +
        _toggleRow('Migration required', 'Data or document migration from a legacy system.', migToggle) +
        _toggleRow('Integrations required', 'Connections to other systems (SAP, MuleSoft, HA Gateway, cross-Vault).', intToggle) +
        integrationsReveal +
        _toggleRow('Decommissioning required', 'Legacy system being retired after go-live.', decToggle) +
        _toggleRow('Vendor validation package', 'Whether the vendor provides IQ/OQ templates. Partial = customer must supplement.', vpToggle) +
      '</div>' +
    '</div>';
  }

  // -------------------------------------------------------------------------
  // STEP 3: Team & Vendors (skippable)
  // -------------------------------------------------------------------------
  function _renderStep3(){
    var teamRows = data.team.map(function(t, i){
      return '<tr>' +
        '<td><input class="ppm-mini-input" placeholder="Name" value="' + _esc(t.name) + '" data-team="' + i + '" data-field="name"></td>' +
        '<td>' +
          '<select class="ppm-mini-input" data-team="' + i + '" data-field="role">' +
            ['PM','Workstream Lead','SME','Quality Lead','Validation Lead','Sponsor'].map(function(r){
              return '<option value="' + r + '"' + (t.role === r ? ' selected' : '') + '>' + r + '</option>';
            }).join('') +
          '</select>' +
        '</td>' +
        '<td><button class="ppm-mini-btn-icon" data-remove-team="' + i + '">×</button></td>' +
      '</tr>';
    }).join('');

    var vendorRows = data.vendors.map(function(v, i){
      return '<tr>' +
        '<td><input class="ppm-mini-input" placeholder="Vendor name" value="' + _esc(v.name) + '" data-vendor="' + i + '" data-field="name"></td>' +
        '<td>' +
          '<select class="ppm-mini-input" data-vendor="' + i + '" data-field="type">' +
            ['Implementation','Validation','Integration','Migration','Training'].map(function(r){
              return '<option value="' + r + '"' + (v.type === r ? ' selected' : '') + '>' + r + '</option>';
            }).join('') +
          '</select>' +
        '</td>' +
        '<td><input class="ppm-mini-input" type="number" placeholder="Hours" value="' + (v.hours || 0) + '" data-vendor="' + i + '" data-field="hours"></td>' +
        '<td><input class="ppm-mini-input" type="number" placeholder="€/h" value="' + (v.rate || 0) + '" data-vendor="' + i + '" data-field="rate"></td>' +
        '<td><button class="ppm-mini-btn-icon" data-remove-vendor="' + i + '">×</button></td>' +
      '</tr>';
    }).join('');

    return '<div class="ppm-wizard-container">' +
      '<div class="ppm-wizard-step-label">Step 3 of 4 · Optional</div>' +
      '<h1 class="ppm-wizard-title">Team and vendors</h1>' +
      '<p class="ppm-wizard-desc">Add team members and vendors. You can add more later. Click "Skip — add later" if you don\'t have details yet.</p>' +

      '<div class="ppm-wizard-card">' +
        '<div class="ppm-wizard-card-title">Team</div>' +
        '<table class="ppm-mini-table">' +
          '<thead><tr><th>Name</th><th style="width:160px">Role</th><th style="width:40px"></th></tr></thead>' +
          '<tbody>' + teamRows + '</tbody>' +
        '</table>' +
        '<button class="ppm-add-row-btn" id="ppm-add-team">+ Add team member</button>' +
      '</div>' +

      '<div class="ppm-wizard-card">' +
        '<div class="ppm-wizard-card-title">Vendors</div>' +
        '<table class="ppm-mini-table">' +
          '<thead><tr><th>Vendor</th><th style="width:140px">Type</th><th style="width:90px">Hours</th><th style="width:80px">€/h</th><th style="width:40px"></th></tr></thead>' +
          '<tbody>' + vendorRows + '</tbody>' +
        '</table>' +
        '<button class="ppm-add-row-btn" id="ppm-add-vendor">+ Add vendor</button>' +
      '</div>' +
    '</div>';
  }

  // -------------------------------------------------------------------------
  // STEP 4: Review & Create
  // -------------------------------------------------------------------------
  function _renderStep4(){
    // Compute what will be generated. ARCHITECTURE: through viewService only.
    var view = PPM.services.viewService;
    var milestonesPreview = view.previewMilestones(data.methodology, view.today());
    var documentsPreview = view.previewDocuments({
      gxpLevel: data.gxpLevel,
      migration: data.migration,
      integrations: data.integrations,
      integrationCount: data.integrationCount,
      decommissioning: data.decommissioning,
      vendorPkg: data.vendorPkg
    });
    var validVendors = data.vendors.filter(function(v){ return v.name; });
    var validTeam = data.team.filter(function(t){ return t.name; });
    var totalBudget = validVendors.reduce(function(s, v){ return s + (v.hours || 0) * (v.rate || 0); }, 0);

    // Warnings
    var warnings = [];
    if(data.goLive){
      var daysToGoLive = view.daysBetween(view.today(), data.goLive);
      if(daysToGoLive < 90 && daysToGoLive > 0){
        warnings.push('Go-Live is only ' + daysToGoLive + ' days away — aggressive timeline.');
      }
      if(daysToGoLive < 0){
        warnings.push('Go-Live date is in the past — please review.');
      }
    }
    if(data.gxpLevel === 'High' && !data.migration && data.system.indexOf('Veeva') >= 0){
      warnings.push('GxP High Veeva implementation without migration is unusual — confirm legacy data handling.');
    }

    var warningsHtml = '';
    if(warnings.length){
      warningsHtml = '<div class="ppm-wizard-warnings">' +
        '<div class="ppm-wizard-warnings-title">' + icons.warning() + ' Worth reviewing</div>' +
        warnings.map(function(w){ return '<div class="ppm-wizard-warning-item">' + _esc(w) + '</div>'; }).join('') +
      '</div>';
    }

    return '<div class="ppm-wizard-container">' +
      '<div class="ppm-wizard-step-label">Step 4 of 4</div>' +
      '<h1 class="ppm-wizard-title">Review and create</h1>' +
      '<p class="ppm-wizard-desc">Here\'s what we\'ll create for your project. Everything is editable once the project is live.</p>' +

      '<div class="ppm-wizard-summary">' +
        '<div class="ppm-wizard-summary-title">' + _esc(data.name || 'Untitled Project') + '</div>' +
        '<div class="ppm-wizard-summary-grid">' +
          _summaryItem('System', data.system) +
          _summaryItem('Methodology', data.methodology) +
          _summaryItem('GxP level', data.gxpLevel) +
          _summaryItem('Go-Live', data.goLive || 'TBD') +
          _summaryItem('PM', data.pm || '—') +
          _summaryItem('Migration', data.migration ? 'Yes' : 'No') +
        '</div>' +
      '</div>' +

      warningsHtml +

      '<div class="ppm-wizard-card ppm-wizard-stats-card">' +
        '<div class="ppm-wizard-card-title">Will be auto-generated</div>' +
        '<div class="ppm-wizard-stats">' +
          _stat(milestonesPreview.length, 'Milestones') +
          _stat(documentsPreview.length, 'Documents') +
          _stat(validTeam.length, 'Team members') +
          _stat(validVendors.length, 'Vendors') +
          _stat('€' + (totalBudget / 1000).toFixed(0) + 'k', 'Total budget') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // -------------------------------------------------------------------------
  // FIELD HELPERS
  // -------------------------------------------------------------------------
  function _field(label, required, type, fieldName, value, placeholder){
    var requiredMark = required ? '<span class="ppm-required">' + required + '</span>' : '';
    var inputType = type || 'text';
    return '<div class="ppm-wizard-field">' +
      '<label class="ppm-wizard-label">' + _esc(label) + requiredMark + '</label>' +
      '<input class="ppm-wizard-input" type="' + inputType + '" ' +
        'value="' + _esc(value || '') + '" ' +
        'placeholder="' + _esc(placeholder || '') + '" ' +
        'data-field="' + fieldName + '">' +
    '</div>';
  }

  function _row(html1, html2){
    return '<div class="ppm-wizard-row">' + html1 + html2 + '</div>';
  }

  function _segToggle(fieldName, currentValue, options, isBoolean){
    var btns = options.map(function(opt){
      var isActive = currentValue === opt;
      var dataValue = isBoolean ? (opt === 'Yes' ? 'true' : 'false') : opt;
      return '<button class="ppm-seg-btn ' + (isActive ? 'ppm-seg-btn-active' : '') + '" ' +
        'data-toggle-field="' + fieldName + '" data-toggle-value="' + dataValue + '">' +
        _esc(opt) + '</button>';
    }).join('');
    return '<div class="ppm-seg">' + btns + '</div>';
  }

  function _toggleRow(label, help, toggleHtml){
    return '<div class="ppm-wizard-toggle-row">' +
      '<div class="ppm-wizard-toggle-info">' +
        '<div class="ppm-wizard-toggle-label">' + _esc(label) + '</div>' +
        '<div class="ppm-wizard-toggle-help">' + _esc(help) + '</div>' +
      '</div>' +
      toggleHtml +
    '</div>';
  }

  function _summaryItem(label, value){
    return '<div class="ppm-wizard-summary-item">' +
      '<span>' + _esc(label) + '</span>' +
      '<strong>' + _esc(value) + '</strong>' +
    '</div>';
  }

  function _stat(value, label){
    return '<div class="ppm-wizard-stat">' +
      '<div class="ppm-wizard-stat-value">' + _esc(String(value)) + '</div>' +
      '<div class="ppm-wizard-stat-label">' + _esc(label) + '</div>' +
    '</div>';
  }

  function _esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // -------------------------------------------------------------------------
  // EVENT WIRING
  // -------------------------------------------------------------------------
  function _wireFooter(){
    document.getElementById('ppm-wizard-cancel').addEventListener('click', _cancel);
    document.getElementById('ppm-wizard-back').addEventListener('click', _back);
    document.getElementById('ppm-wizard-next').addEventListener('click', _next);

    var skipBtn = document.getElementById('ppm-wizard-skip');
    if(skipBtn) skipBtn.addEventListener('click', _skip);
  }

  function _wireStepInputs(){
    // Direct field inputs (text, number, date, select for system/methodology)
    document.querySelectorAll('[data-field]').forEach(function(el){
      var field = el.getAttribute('data-field');
      // Skip inputs inside team/vendor rows — they have their own handlers
      if(el.hasAttribute('data-team') || el.hasAttribute('data-vendor')) return;

      el.addEventListener('input', function(e){
        var val = e.target.value;
        if(e.target.type === 'number') val = val === '' ? 0 : parseInt(val) || 0;
        data[field] = val;
      });
      el.addEventListener('change', function(e){
        var val = e.target.value;
        if(e.target.type === 'number') val = val === '' ? 0 : parseInt(val) || 0;
        data[field] = val;
      });
    });

    // Segment toggles (gxpLevel, migration, integrations, decommissioning, vendorPkg)
    document.querySelectorAll('[data-toggle-field]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        var field = e.currentTarget.getAttribute('data-toggle-field');
        var rawValue = e.currentTarget.getAttribute('data-toggle-value');
        var value = rawValue === 'true' ? true : (rawValue === 'false' ? false : rawValue);
        data[field] = value;
        // If integrations was toggled, re-render Step 2 to show/hide reveal
        if(field === 'integrations'){
          _renderStepBody();
        } else {
          // Just update active class without full re-render
          document.querySelectorAll('[data-toggle-field="' + field + '"]').forEach(function(b){
            b.classList.toggle('ppm-seg-btn-active', b === e.currentTarget);
          });
        }
      });
    });

    // Team row inputs
    document.querySelectorAll('[data-team]').forEach(function(el){
      el.addEventListener('input', function(e){
        var idx = parseInt(e.target.getAttribute('data-team'));
        var field = e.target.getAttribute('data-field');
        if(data.team[idx]) data.team[idx][field] = e.target.value;
      });
    });
    document.querySelectorAll('[data-remove-team]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        var idx = parseInt(e.currentTarget.getAttribute('data-remove-team'));
        data.team.splice(idx, 1);
        _renderStepBody();
      });
    });
    var addTeamBtn = document.getElementById('ppm-add-team');
    if(addTeamBtn){
      addTeamBtn.addEventListener('click', function(){
        data.team.push({ name:'', role:'SME' });
        _renderStepBody();
      });
    }

    // Vendor row inputs
    document.querySelectorAll('[data-vendor]').forEach(function(el){
      el.addEventListener('input', function(e){
        var idx = parseInt(e.target.getAttribute('data-vendor'));
        var field = e.target.getAttribute('data-field');
        if(data.vendors[idx]){
          var val = e.target.value;
          if(field === 'hours' || field === 'rate') val = parseInt(val) || 0;
          data.vendors[idx][field] = val;
        }
      });
    });
    document.querySelectorAll('[data-remove-vendor]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        var idx = parseInt(e.currentTarget.getAttribute('data-remove-vendor'));
        data.vendors.splice(idx, 1);
        _renderStepBody();
      });
    });
    var addVendorBtn = document.getElementById('ppm-add-vendor');
    if(addVendorBtn){
      addVendorBtn.addEventListener('click', function(){
        data.vendors.push({ name:'', type:'Implementation', hours:200, rate:150 });
        _renderStepBody();
      });
    }
  }

  function _renderStepBody(){
    var body = document.getElementById('ppm-wizard-body');
    if(body){
      body.innerHTML = _renderStep();
      _wireStepInputs();
    }
  }

  // -------------------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------------------
  function _cancel(){
    var existingState = PPM.services.projectService.getState();
    if(!existingState){
      // No prior state — go back to welcome
      close();
      PPM.ui.welcome.show();
    } else {
      // There's a project — just close, return to shell
      close();
    }
  }

  function _back(){
    if(step > 1){
      step--;
      _render();
    }
  }

  function _next(){
    if(step === 1){
      var v = PPM.services.viewService.validateWizardStep1(data);
      if(!v.valid){
        PPM.ui.toast.show(v.error, 'error', 3500);
        return;
      }
    }

    if(step < 4){
      step++;
      _render();
      return;
    }

    // step === 4: commit
    _commit();
  }

  function _skip(){
    // From step 3 only, skip to review
    if(step === 3){
      step = 4;
      _render();
    }
  }

  function _commit(){
    var result = PPM.services.projectService.create({
      name: data.name,
      projectId: data.projectId,
      pm: data.pm,
      sponsor: data.sponsor,
      system: data.system,
      methodology: data.methodology,
      goLive: data.goLive,
      gxpLevel: data.gxpLevel,
      migration: data.migration,
      integrations: data.integrations,
      integrationCount: data.integrationCount,
      decommissioning: data.decommissioning,
      vendorPkg: data.vendorPkg,
      team: data.team.filter(function(t){ return t.name; }),
      vendors: data.vendors.filter(function(v){ return v.name; })
    });

    if(!result.ok){
      PPM.ui.toast.show('Could not create project: ' + result.error, 'error', 4500);
      return;
    }

    close();
    PPM.ui.toast.show('Project created', 'success');
  }

  // -------------------------------------------------------------------------
  // EVENT SUBSCRIPTIONS
  // -------------------------------------------------------------------------
  PPM.events.on('ui:wizard_requested', open);

  PPM.ui.wizard = Object.freeze({
    open: open,
    close: close
  });
})();
