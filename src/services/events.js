/* ============================================================================
   File: src/services/events.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.events
   Dependencies: none
   ============================================================================ */
(function(){
  var listeners = {};
  function on(event, handler){
    if(!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }
  function off(event, handler){
    if(!listeners[event]) return;
    listeners[event] = listeners[event].filter(function(h){ return h !== handler; });
  }
  function emit(event, payload){
    (listeners[event] || []).forEach(function(h){
      try { h(payload); } catch(e){ console.error('Event handler error for ' + event, e); }
    });
  }
  PPM.events = Object.freeze({ on:on, off:off, emit:emit });
})();
