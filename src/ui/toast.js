/* ============================================================================
   File: src/ui/toast.js
   Dependencies: PPM (root namespace)
   Exports: PPM.ui.toast.show(message, type?, duration?)
   types: 'info' (default) | 'success' | 'error' | 'warning'
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};

  var container = null;

  function _ensureContainer(){
    if(container) return container;
    container = document.createElement('div');
    container.className = 'ppm-toast-container';
    document.body.appendChild(container);
    return container;
  }

  function show(message, type, duration){
    type = type || 'info';
    duration = duration || 2400;
    var c = _ensureContainer();
    var el = document.createElement('div');
    el.className = 'ppm-toast ppm-toast-' + type;
    el.textContent = message;
    c.appendChild(el);
    // Trigger fade-in on next frame
    requestAnimationFrame(function(){ el.classList.add('ppm-toast-show'); });
    setTimeout(function(){
      el.classList.remove('ppm-toast-show');
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 250);
    }, duration);
  }

  PPM.ui.toast = Object.freeze({ show: show });
})();
