/* ============================================================================
   File: src/ui/boot.js
   Dependencies: All UI modules, all services
   Loaded LAST. Runs the boot sequence:
     1. Try to load existing state from storage
     2. If state exists -> render shell
     3. If no state -> show welcome screen
   ============================================================================ */

(function(){
  function boot(){
    if(!document.body){
      // Should not happen since this script is at end of body, but be safe
      document.addEventListener('DOMContentLoaded', boot);
      return;
    }

    var loadResult = PPM.services.projectService.loadFromStorage();

    if(loadResult.ok && loadResult.state){
      // Existing project — render shell
      PPM.ui.shell.render();
      PPM.ui.banner.render();
    } else {
      if(!loadResult.ok){
        // Corrupt state — log, then fall through to welcome
        console.warn('PPM: storage load failed:', loadResult.error);
        PPM.ui.toast.show('Existing project could not be loaded. Starting fresh.', 'warning', 4000);
      }
      PPM.ui.welcome.show();
    }

    // Listen for events that need shell -> welcome transitions
    PPM.events.on('project:reset', function(){
      PPM.ui.shell.hide();
      PPM.ui.welcome.show();
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
