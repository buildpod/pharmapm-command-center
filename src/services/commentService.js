/* ============================================================================
   File: src/services/commentService.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.services.commentService
   ============================================================================ */
(function(){
  function _keyFor(table, id){ return table + '_' + id; }

  function list(table, id){
    var state = PPM.services.projectService.getState();
    if(!state || !state.comments) return [];
    return state.comments[_keyFor(table, id)] || [];
  }

  function add(table, id, text, author){
    var state = PPM.services.projectService.getState();
    if(!state) return { ok:false, error:'No project loaded' };
    if(!text || !text.trim()) return { ok:false, error:'Empty comment' };
    if(!state.comments) state.comments = {};
    var k = _keyFor(table, id);
    if(!state.comments[k]) state.comments[k] = [];
    state.comments[k].push({
      author: author || (state.meta && state.meta.pm) || 'User',
      text: text.trim(),
      date: PPM.domain.dates.nowISO()
    });
    state.updatedAt = PPM.domain.dates.nowISO();
    PPM.events.emit('state:changed', state);
    PPM.services.editService.forceSave();
    return { ok:true };
  }

  function remove(table, id, index){
    var state = PPM.services.projectService.getState();
    if(!state || !state.comments) return { ok:false };
    var k = _keyFor(table, id);
    if(!state.comments[k]) return { ok:false };
    state.comments[k].splice(index, 1);
    state.updatedAt = PPM.domain.dates.nowISO();
    PPM.events.emit('state:changed', state);
    PPM.services.editService.forceSave();
    return { ok:true };
  }

  function count(table, id){ return list(table, id).length; }

  PPM.services.commentService = Object.freeze({
    list: list, add: add, remove: remove, count: count
  });
})();
