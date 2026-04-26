/* ============================================================================
   File: src/services/lifecycleService.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.services.lifecycleService
   Dependencies: PPM.services.projectService, PPM.events
   Phase 1 hardening: only allowed path for lifecycle mutation.
   - Validates target value is a known enum
   - Validates the transition is allowed
   - Updates state.lifecycle and state.updatedAt atomically
   - Emits 'lifecycle:changed' event
   - editService and direct mutation MUST NOT change state.lifecycle
   ============================================================================ */
(function(){
  // Allowed lifecycle values — single source of truth for this enum
  var ALLOWED_VALUES = ['draft', 'active', 'closed', 'archived'];

  // Allowed transitions matrix — { fromState: [allowedTargets] }
  // 'reopen' (closed → active) gated to admin in v2 per ADR-003; allowed in v1 for usability.
  // active → draft NOT allowed (rebaselining is a v2 concept).
  var ALLOWED_TRANSITIONS = {
    'draft':    ['active', 'archived'],
    'active':   ['closed', 'archived'],
    'closed':   ['active', 'archived'],
    'archived': []  // terminal in v1 (restore is v2 admin action)
  };

  function allowedTransitions(fromState){
    return (ALLOWED_TRANSITIONS[fromState] || []).slice();
  }

  function transition(targetLifecycle){
    var state = PPM.services.projectService.getState();
    if(!state) return { ok:false, error:'No project loaded' };

    if(ALLOWED_VALUES.indexOf(targetLifecycle) < 0){
      return { ok:false, error:'Invalid lifecycle value: ' + targetLifecycle + '. Allowed: ' + ALLOWED_VALUES.join(', ') };
    }

    var current = state.lifecycle;
    if(current === targetLifecycle){
      return { ok:false, error:'Already in lifecycle: ' + targetLifecycle };
    }

    var allowed = ALLOWED_TRANSITIONS[current] || [];
    if(allowed.indexOf(targetLifecycle) < 0){
      return {
        ok:false,
        error:'Transition not allowed: ' + current + ' → ' + targetLifecycle +
              '. Allowed from ' + current + ': ' + (allowed.length ? allowed.join(', ') : '(none)')
      };
    }

    var previous = state.lifecycle;
    state.lifecycle = targetLifecycle;
    state.updatedAt = PPM.domain.dates.nowISO();
    PPM.events.emit('lifecycle:changed', { from: previous, to: targetLifecycle, projectId: state.projectId });
    PPM.events.emit('state:changed', state);
    PPM.services.editService.forceSave();
    return { ok:true, from: previous, to: targetLifecycle };
  }

  PPM.services.lifecycleService = Object.freeze({
    transition:          transition,
    allowedTransitions:  allowedTransitions,
    ALLOWED_VALUES:      Object.freeze(ALLOWED_VALUES.slice())
  });
})();
