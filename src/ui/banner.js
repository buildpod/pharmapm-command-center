/* ============================================================================
   File: src/ui/banner.js
   Dependencies: PPM.events, PPM.services.projectService
   Exports: PPM.ui.banner.{render, dismiss}
   Subscribes to:
     - project:loaded, project:demo_loaded, project:created, project:imported
     - storage:quota_exceeded
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};

  var dismissed = { demo: false, quota: false };  // per-session dismissals

  function render(){
    var existing = document.getElementById('ppm-banners');
    if(existing) existing.parentNode.removeChild(existing);

    var state = PPM.services.projectService.getState();
    var banners = [];

    if(state && state.isDemo === true && !dismissed.demo){
      banners.push({
        id: 'demo',
        type: 'demo',
        text: 'DEMO PROJECT — This is sample data, not your real project.',
        cta: { label: 'Start New Project', action: 'newProject' }
      });
    }

    // Quota banner is set by storage:quota_exceeded handler — see _showQuotaBanner

    if(banners.length === 0) return;

    var container = document.createElement('div');
    container.id = 'ppm-banners';
    container.className = 'ppm-banners';

    banners.forEach(function(b){
      var bn = document.createElement('div');
      bn.className = 'ppm-banner ppm-banner-' + b.type;
      bn.setAttribute('data-banner-id', b.id);
      var inner = '<span class="ppm-banner-text">' + _escape(b.text) + '</span>';
      if(b.cta){
        inner += '<button class="ppm-banner-cta" data-action="' + b.cta.action + '">' + _escape(b.cta.label) + '</button>';
      }
      inner += '<button class="ppm-banner-close" aria-label="Dismiss">×</button>';
      bn.innerHTML = inner;
      container.appendChild(bn);
    });

    document.body.insertBefore(container, document.body.firstChild);

    // Wire up dismiss + CTA
    container.querySelectorAll('.ppm-banner-close').forEach(function(btn){
      btn.addEventListener('click', function(e){
        var bannerEl = e.target.closest('.ppm-banner');
        var bannerId = bannerEl.getAttribute('data-banner-id');
        dismissed[bannerId] = true;
        bannerEl.parentNode.removeChild(bannerEl);
        if(container.children.length === 0) container.parentNode.removeChild(container);
      });
    });
    container.querySelectorAll('.ppm-banner-cta').forEach(function(btn){
      btn.addEventListener('click', function(e){
        var action = e.target.getAttribute('data-action');
        if(action === 'newProject'){
          // Reset and show welcome
          PPM.services.projectService.reset();
          PPM.events.emit('ui:show_welcome', null);
        }
      });
    });
  }

  function _showQuotaBanner(){
    if(dismissed.quota) return;
    var container = document.getElementById('ppm-banners');
    if(!container){
      container = document.createElement('div');
      container.id = 'ppm-banners';
      container.className = 'ppm-banners';
      document.body.insertBefore(container, document.body.firstChild);
    }
    if(container.querySelector('[data-banner-id="quota"]')) return; // already showing
    var bn = document.createElement('div');
    bn.className = 'ppm-banner ppm-banner-quota';
    bn.setAttribute('data-banner-id', 'quota');
    bn.innerHTML =
      '<span class="ppm-banner-text">Browser storage is full. Export your project as JSON to keep your work safe.</span>' +
      '<button class="ppm-banner-cta" data-action="exportNow">Export now</button>' +
      '<button class="ppm-banner-close" aria-label="Dismiss">×</button>';
    container.appendChild(bn);

    bn.querySelector('.ppm-banner-close').addEventListener('click', function(){
      dismissed.quota = true;
      bn.parentNode.removeChild(bn);
    });
    bn.querySelector('.ppm-banner-cta').addEventListener('click', function(){
      PPM.events.emit('ui:export_request', null);
    });
  }

  function dismiss(bannerId){
    dismissed[bannerId] = true;
    var el = document.querySelector('.ppm-banner[data-banner-id="' + bannerId + '"]');
    if(el && el.parentNode) el.parentNode.removeChild(el);
  }

  function _escape(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // Subscribe to events
  PPM.events.on('project:loaded', render);
  PPM.events.on('project:demo_loaded', render);
  PPM.events.on('project:created', render);
  PPM.events.on('project:imported', render);
  PPM.events.on('project:reset', function(){
    var c = document.getElementById('ppm-banners');
    if(c && c.parentNode) c.parentNode.removeChild(c);
    dismissed.demo = false; // re-eligible next demo load
  });
  PPM.events.on('storage:quota_exceeded', _showQuotaBanner);

  PPM.ui.banner = Object.freeze({
    render: render,
    dismiss: dismiss
  });
})();
