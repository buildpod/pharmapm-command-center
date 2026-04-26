/* ============================================================================
   File: src/ui/welcome.js
   Dependencies: PPM.ui.icons, PPM.services.projectService, PPM.events
   Exports: PPM.ui.welcome.{show, hide}
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};
  var icons = PPM.ui.icons;

  function show(){
    var existing = document.getElementById('ppm-welcome');
    if(existing) existing.parentNode.removeChild(existing);

    var overlay = document.createElement('div');
    overlay.id = 'ppm-welcome';
    overlay.className = 'ppm-welcome';

    overlay.innerHTML =
      '<div class="ppm-welcome-card">' +
        '<div class="ppm-welcome-mark">P</div>' +
        '<h1 class="ppm-welcome-title">Welcome to PharmaPM Pro</h1>' +
        '<p class="ppm-welcome-sub">The project cockpit for pharma and biotech system implementations.</p>' +

        '<div class="ppm-welcome-options">' +
          '<button class="ppm-welcome-option ppm-welcome-option-primary" data-action="new">' +
            '<div class="ppm-welcome-option-icon">' + icons.plus('icon-md') + '</div>' +
            '<div class="ppm-welcome-option-text">' +
              '<div class="ppm-welcome-option-title">Start a new project</div>' +
              '<div class="ppm-welcome-option-desc">Configure your project in 4 guided steps. Pharma templates auto-populate.</div>' +
            '</div>' +
          '</button>' +

          '<button class="ppm-welcome-option" data-action="import">' +
            '<div class="ppm-welcome-option-icon">' + icons.upload('icon-md') + '</div>' +
            '<div class="ppm-welcome-option-text">' +
              '<div class="ppm-welcome-option-title">Import existing project</div>' +
              '<div class="ppm-welcome-option-desc">Restore a previously exported .json file.</div>' +
            '</div>' +
          '</button>' +

          '<button class="ppm-welcome-option" data-action="demo">' +
            '<div class="ppm-welcome-option-icon">' + icons.sparkles('icon-md') + '</div>' +
            '<div class="ppm-welcome-option-text">' +
              '<div class="ppm-welcome-option-title">Load demo project <span class="ppm-welcome-tag">DEMO</span></div>' +
              '<div class="ppm-welcome-option-desc">Veeva RIM implementation — explore the app instantly without setup.</div>' +
            '</div>' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelector('[data-action="new"]').addEventListener('click', function(){
      hide();
      PPM.ui.wizard.open();
    });

    overlay.querySelector('[data-action="import"]').addEventListener('click', function(){
      _handleImport();
    });

    overlay.querySelector('[data-action="demo"]').addEventListener('click', function(){
      var result = PPM.services.projectService.loadDemo();
      if(result.ok){
        hide();
        PPM.ui.toast.show('Demo project loaded', 'success');
      } else {
        PPM.ui.toast.show('Failed to load demo: ' + result.error, 'error');
      }
    });
  }

  function hide(){
    var existing = document.getElementById('ppm-welcome');
    if(existing && existing.parentNode){
      existing.parentNode.removeChild(existing);
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
        if(result.ok){
          hide();
          PPM.ui.toast.show('Project imported', 'success');
        } else {
          PPM.ui.toast.show('Import failed: ' + result.error, 'error', 4000);
        }
      };
      reader.onerror = function(){
        PPM.ui.toast.show('Could not read file', 'error');
      };
      reader.readAsText(file);
    });
    input.click();
  }

  // Re-show welcome if user resets project
  PPM.events.on('ui:show_welcome', show);
  PPM.events.on('project:reset', show);

  PPM.ui.welcome = Object.freeze({
    show: show,
    hide: hide
  });
})();
