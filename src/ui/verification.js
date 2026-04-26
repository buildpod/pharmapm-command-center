/* ============================================================================
   File: src/ui/verification.js
   Verification buttons for the Session A′ page. Will be replaced by real UI in Section 2.
   ============================================================================ */

/* ============================================================================
   MODULE: verification UI (this is UI — Session A-prime only)
   ============================================================================ */
function runTests(){
  var out = document.getElementById('results');
  var results = PPM.test.runAll();
  var passed = results.filter(function(r){ return r.ok; }).length;
  var failed = results.filter(function(r){ return !r.ok; });
  var html = (failed.length === 0 ? '<span class="ok">' : '<span class="err">') + passed + '/' + results.length + ' passed</span>\n\n';
  if(failed.length > 0){
    html += '<span class="err">FAILED:</span>\n';
    failed.forEach(function(r){ html += '  ✗ ' + r.label + '\n'; });
    html += '\n';
  }
  html += '<span class="ok">PASSED:</span>\n';
  results.filter(function(r){ return r.ok; }).forEach(function(r){ html += '  ✓ ' + r.label + '\n'; });
  out.innerHTML = html;
}

function inspectAPI(){
  var out = document.getElementById('results');
  var lines = ['Public APIs (frozen with Object.freeze):'];
  function walk(obj, path){
    Object.keys(obj).forEach(function(k){
      if(k.indexOf('_') === 0 || k === '__stub') return;
      var v = obj[k];
      var newPath = path + '.' + k;
      if(typeof v === 'function') lines.push('  ' + newPath + '()');
      else if(typeof v === 'object' && v !== null && !Array.isArray(v)) walk(v, newPath);
    });
  }
  walk(PPM.domain, 'PPM.domain');
  lines.push('');
  walk(PPM.adapters, 'PPM.adapters');
  lines.push('');
  walk(PPM.services, 'PPM.services');
  lines.push('');
  lines.push('PPM.config.rules (read-only config)');
  lines.push('PPM.schema.v1 (frozen schema)');
  lines.push('PPM.migrations.migrate()');
  lines.push('PPM.events.{on, off, emit}');
  out.textContent = lines.join('\n');
}

function inspectSchema(){
  var out = document.getElementById('results');
  var text = 'PPM.schema.CURRENT_VERSION: ' + PPM.schema.CURRENT_VERSION + '\n\n';
  text += 'Entities defined:\n';
  Object.keys(PPM.schema.entities).forEach(function(k){
    text += '  ' + k + ':\n';
    Object.keys(PPM.schema.entities[k].fields).forEach(function(f){
      var def = PPM.schema.entities[k].fields[f];
      text += '    - ' + f + ': ' + def.type + (def.required ? ' (required)' : '') + '\n';
    });
  });
  text += '\nState v1 top-level:\n' + JSON.stringify(Object.keys(PPM.schema.v1), null, 2);
  text += '\n\nDefault state skeleton:\n' + JSON.stringify(PPM.schema.defaultState(), null, 2);
  out.textContent = text;
}

function inspectConfig(){
  var out = document.getElementById('results');
  var text = 'PPM.config.rules:\n\n';
  text += 'rag:  ' + JSON.stringify(PPM.config.rules.rag) + '\n';
  text += 'risk: ' + JSON.stringify(PPM.config.rules.risk) + '\n';
  text += 'burn: ' + JSON.stringify(PPM.config.rules.burn) + '\n\n';
  text += 'enums:\n';
  Object.keys(PPM.config.rules.enums).forEach(function(k){
    text += '  ' + k + ': ' + PPM.config.rules.enums[k].join(' | ') + '\n';
  });
  text += '\nMethodologies: ' + Object.keys(PPM.config.rules.methodologies).join(' | ') + '\n';
  text += '\nDocument rules (counts):\n';
  Object.keys(PPM.config.rules.documents).forEach(function(k){
    text += '  ' + k + ': ' + PPM.config.rules.documents[k].length + ' docs\n';
  });
  out.textContent = text;
}

function quickSample(){
  var out = document.getElementById('results');
  PPM.services.projectService.loadDemo();
  var state = PPM.services.projectService.getState();
  var dash = PPM.services.reportService.buildDashboardData(state);
  // ARCHITECTURE: even verification (a dev tool) goes through services, not domain.
  var health = PPM.services.viewService.computeProjectHealth(state);
  var badges = PPM.services.viewService.computeBadges(state);
  var text = 'Sample project loaded:\n\n';
  text += 'Project: ' + state.meta.name + '\n';
  text += 'Project ID: ' + state.projectId + '\n';
  text += 'Lifecycle: ' + state.lifecycle + '\n';
  text += 'Schema: v' + state.schemaVersion + '\n';
  text += 'Created: ' + state.createdAt + '\n';
  text += 'Updated: ' + state.updatedAt + '\n\n';
  text += 'Health: ' + health.level + ' — ' + health.reason + '\n\n';
  text += 'KPIs:\n';
  text += '  Milestones: ' + dash.kpis.milestones.done + '/' + dash.kpis.milestones.total + ' (' + dash.kpis.milestones.pct + '%)\n';
  text += '  Open risks: ' + dash.kpis.risks.open + ' (' + dash.kpis.risks.critical + ' critical)\n';
  text += '  Budget burn: ' + dash.kpis.budget.pct + '%\n';
  text += '  Documents: ' + dash.kpis.documents.approved + '/' + dash.kpis.documents.required + '\n\n';
  text += 'Sidebar badges:\n';
  Object.keys(badges).forEach(function(k){
    var b = badges[k];
    text += '  ' + k + ': ' + (b.hidden ? '(hidden)' : (b.count + ' · ' + b.level)) + '\n';
  });
  out.textContent = text;
  // Reset goes through service. (verification.js is dev-only; even so, no
  // direct adapter calls — UI layer must consume services exclusively.)
  PPM.services.projectService.reset();
}

console.log('%cPharmaPM Pro — Session A′ Hardened loaded', 'color:#166534;font-weight:bold');
console.log('Try: PPM.test.runAll()');
