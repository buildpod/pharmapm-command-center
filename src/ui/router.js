/* ============================================================================
   File: src/ui/router.js
   Dependencies: PPM.events
   Exports: PPM.ui.router.{getView, navigate, getViews}
   Manages currentView state and emits ui:view_changed when navigation happens.
   Section B3 will hook into ui:view_changed to render the correct grid/dashboard.
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};

  // Allowed views — keys match sidebar nav and view labels
  var VIEWS = {
    milestones: { label: 'Milestones',   group: 'Plan',    singular: 'milestone' },
    tasks:      { label: 'Tasks',        group: 'Execute', singular: 'task' },
    risks:      { label: 'Risks',        group: 'Control', singular: 'risk' },
    documents:  { label: 'Documents',    group: 'Control', singular: 'document' },
    costs:      { label: 'Costs',        group: 'Control', singular: 'vendor' },
    dashboard:  { label: 'Dashboard',    group: 'Report',  singular: null },
    steerco:    { label: 'SteerCo',      group: 'Report',  singular: null }
  };

  var currentView = 'milestones';  // default after project loaded

  function getView(){ return currentView; }

  function navigate(view){
    if(!VIEWS[view]){
      console.warn('Router: unknown view', view);
      return { ok: false, error: 'Unknown view: ' + view };
    }
    if(view === currentView) return { ok: true, unchanged: true };
    var previous = currentView;
    currentView = view;
    PPM.events.emit('ui:view_changed', { from: previous, to: view, meta: VIEWS[view] });
    return { ok: true };
  }

  function getViews(){
    // Return copy keyed by view id
    var out = {};
    Object.keys(VIEWS).forEach(function(k){ out[k] = Object.assign({}, VIEWS[k]); });
    return out;
  }

  function getViewMeta(view){
    return VIEWS[view] ? Object.assign({}, VIEWS[view]) : null;
  }

  PPM.ui.router = Object.freeze({
    getView:    getView,
    navigate:   navigate,
    getViews:   getViews,
    getViewMeta: getViewMeta
  });
})();
