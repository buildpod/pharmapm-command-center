/* ============================================================================
   File: src/ui/detail.js
   Dependencies: PPM.ui.icons, PPM.ui.columns, PPM.ui.toast,
                 PPM.services.projectService, PPM.services.commentService,
                 PPM.events
   Exports: PPM.ui.detail.{open, close, toggle, isOpen}

   Behavior:
   - Closed by default on view entry (per spec)
   - Opens on row click in grid
   - Displays editable fields, computed values, linked items, comments thread
   - Per-view memory: if user opens detail for a milestone, switches to risks,
     opens detail for a risk, switches back to milestones — the original
     milestone selection should be restored.
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};
  var icons = PPM.ui.icons;

  // Per-view memory: which row was last opened in each table
  var lastOpenPerView = {
    milestones: null, tasks: null, risks: null, documents: null, costs: null
  };

  var currentTable = null;
  var currentRowId = null;

  // -------------------------------------------------------------------------
  // PUBLIC API
  // -------------------------------------------------------------------------
  function open(table, rowId){
    currentTable = table;
    currentRowId = rowId;
    lastOpenPerView[table] = rowId;
    _render();
  }

  function close(){
    var pane = document.getElementById('ppm-detail');
    if(pane && pane.parentNode) pane.parentNode.removeChild(pane);
    currentTable = null;
    currentRowId = null;
  }

  function toggle(table, rowId){
    if(isOpen() && currentTable === table && currentRowId === rowId){
      close();
    } else {
      open(table, rowId);
    }
  }

  function isOpen(){
    return !!document.getElementById('ppm-detail');
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  function _render(){
    var existing = document.getElementById('ppm-detail');
    if(existing) existing.parentNode.removeChild(existing);

    var state = PPM.services.projectService.getState();
    if(!state){ return; }
    var rows = state[currentTable] || [];
    var row = rows.find(function(r){ return r.id === currentRowId; });
    if(!row){
      // Row was deleted; close
      close();
      return;
    }

    var cols = PPM.ui.columns.get(currentTable);
    var commentList = PPM.services.commentService.list(currentTable, currentRowId);
    var meta = PPM.ui.router.getViewMeta(currentTable) || {};
    var rowTitle = _rowTitle(currentTable, row);

    var pane = document.createElement('aside');
    pane.id = 'ppm-detail';
    pane.className = 'ppm-detail';
    pane.innerHTML =
      _renderHeader(meta, rowTitle, currentRowId) +
      _renderBody(cols, row, currentTable) +
      _renderLinkedItems(currentTable, row, state) +
      _renderComments(commentList, currentTable, currentRowId);

    // Append to workspace so it sits next to grid
    var workspace = document.querySelector('.ppm-workspace');
    if(workspace){
      workspace.appendChild(pane);
    } else {
      document.body.appendChild(pane);
    }

    _wireEvents();
  }

  function _rowTitle(table, row){
    if(table === 'milestones')      return row.name || 'Milestone';
    if(table === 'tasks')           return row.name || 'Task';
    if(table === 'risks')           return row.desc || 'Risk';
    if(table === 'documents')       return row.name || 'Document';
    if(table === 'costs')           return row.vendor || 'Vendor';
    return 'Item';
  }

  function _renderHeader(meta, title, id){
    return '<header class="ppm-detail-header">' +
      '<div class="ppm-detail-header-left">' +
        '<div class="ppm-detail-eyebrow">' + _esc(meta.singular ? meta.singular.toUpperCase() : (meta.label || '').toUpperCase()) + ' #' + id + '</div>' +
        '<div class="ppm-detail-title">' + _esc(title) + '</div>' +
      '</div>' +
      '<button class="ppm-detail-close" id="ppm-detail-close" aria-label="Close">' + icons.close() + '</button>' +
    '</header>';
  }

  function _renderBody(cols, row, table){
    // Group columns: identity (auto/immutable) hidden, editable shown
    var fieldsHtml = cols
      .filter(function(c){ return c.type !== 'auto'; })
      .map(function(c){ return _renderField(c, row, table); })
      .join('');

    return '<div class="ppm-detail-section">' +
      '<div class="ppm-detail-section-title">Details</div>' +
      '<div class="ppm-detail-fields">' + fieldsHtml + '</div>' +
    '</div>';
  }

  function _renderField(c, row, table){
    var val = row[c.key];
    var help = c.help ? '<div class="ppm-detail-field-help">' + _esc(c.help) + '</div>' : '';
    var valueHtml;

    if(c.type === 'computed'){
      valueHtml = '<div class="ppm-detail-field-value ppm-detail-field-computed">' +
        _renderComputedDisplay(table, c.key, row) +
      '</div>';
    } else {
      valueHtml = _renderEditableField(c, val, row.id, table);
    }

    return '<div class="ppm-detail-field">' +
      '<label class="ppm-detail-field-label">' + _esc(c.label) + '</label>' +
      valueHtml +
      help +
    '</div>';
  }

  function _renderEditableField(c, val, rowId, table){
    var safeVal = val == null ? '' : val;
    if(c.type === 'dropdown'){
      var opts = (c.options || []).map(function(o){
        var sel = String(safeVal) === String(o) ? ' selected' : '';
        return '<option value="' + _esc(o) + '"' + sel + '>' + _esc(o) + '</option>';
      }).join('');
      return '<select class="ppm-detail-input" data-detail-field="' + _esc(c.key) + '" data-detail-rowid="' + rowId + '" data-detail-type="dropdown">' + opts + '</select>';
    }
    if(c.type === 'date'){
      return '<input class="ppm-detail-input" type="date" value="' + _esc(safeVal) + '" data-detail-field="' + _esc(c.key) + '" data-detail-rowid="' + rowId + '" data-detail-type="date">';
    }
    if(c.type === 'number'){
      return '<input class="ppm-detail-input ppm-num" type="number" value="' + _esc(safeVal) + '" data-detail-field="' + _esc(c.key) + '" data-detail-rowid="' + rowId + '" data-detail-type="number">';
    }
    // Long text fields use textarea
    if(c.key === 'notes' || c.key === 'desc' || c.key === 'rationale'){
      return '<textarea class="ppm-detail-textarea" data-detail-field="' + _esc(c.key) + '" data-detail-rowid="' + rowId + '" data-detail-type="text">' + _esc(safeVal) + '</textarea>';
    }
    return '<input class="ppm-detail-input" type="text" value="' + _esc(safeVal) + '" data-detail-field="' + _esc(c.key) + '" data-detail-rowid="' + rowId + '" data-detail-type="text">';
  }

  function _renderComputedDisplay(table, key, row){
    // ARCHITECTURE: enrich via viewService instead of calling domain directly.
    // This eliminates the duplicated business derivation that previously lived
    // here AND in grid.js. Single source of truth: PPM.services.viewService.
    var enriched = PPM.services.viewService.enrichRow(table, row);

    if(table === 'milestones' && key === '_rag'){
      var rag = enriched._rag || 'Green';
      return '<span class="ppm-status-badge ppm-status-' + rag.toLowerCase() + '">' + rag + '</span>';
    }
    if(table === 'milestones' && key === '_depStatus'){
      var dep = enriched._depStatus || 'Clear';
      var depClass = dep === 'Clear' ? 'green' : (dep === 'Waiting' ? 'amber' : 'red');
      return '<span class="ppm-status-badge ppm-status-' + depClass + '">' + dep + '</span>';
    }
    if(table === 'risks' && key === '_score'){
      var band = enriched._scoreBand || 'low';
      return '<span class="ppm-status-badge ppm-status-' + band + '">' + (enriched._score || 0) + '</span>';
    }
    if(table === 'costs'){
      if(key === '_burn'){
        return '<span class="ppm-num">' + (enriched._burn || 0) + '%</span>';
      }
      if(key === '_cost'){
        return '<span class="ppm-num">€' + Number(enriched._cost || 0).toLocaleString() + '</span>';
      }
      if(key === '_budgetRag'){
        var bb = enriched._budgetRag || 'green';
        return '<span class="ppm-status-badge ppm-status-' + bb + '">' + bb.toUpperCase() + '</span>';
      }
    }
    if(table === 'tasks' && key === '_variance'){
      var v = enriched._variance || 0;
      return '<span class="ppm-num">' + (v > 0 ? '+' : '') + v + '%</span>';
    }
    return '—';
  }

  // -------------------------------------------------------------------------
  // LINKED ITEMS
  // -------------------------------------------------------------------------
  function _renderLinkedItems(table, row, state){
    var linked = [];
    if(table === 'milestones'){
      // Tasks linked to this milestone
      var linkedTasks = (state.tasks || []).filter(function(t){ return t.milestoneId === row.id; });
      if(linkedTasks.length){
        linked.push({
          title: 'Tasks (' + linkedTasks.length + ')',
          items: linkedTasks.map(function(t){ return { id:t.id, label:t.name, sub:t.status, table:'tasks' }; })
        });
      }
      // Predecessor milestone
      if(row.predecessor){
        var pred = (state.milestones || []).find(function(m){ return m.id === row.predecessor; });
        if(pred){
          linked.push({
            title: 'Predecessor',
            items: [{ id:pred.id, label:'#' + pred.id + ' · ' + pred.name, sub:pred.status, table:'milestones' }]
          });
        }
      }
    } else if(table === 'tasks' && row.milestoneId){
      var ms = (state.milestones || []).find(function(m){ return m.id === row.milestoneId; });
      if(ms){
        linked.push({
          title: 'Linked milestone',
          items: [{ id:ms.id, label:'#' + ms.id + ' · ' + ms.name, sub:ms.status, table:'milestones' }]
        });
      }
    }

    if(!linked.length) return '';

    var sectionsHtml = linked.map(function(group){
      var itemsHtml = group.items.map(function(item){
        return '<div class="ppm-detail-linked-item" data-link-table="' + _esc(item.table) + '" data-link-id="' + item.id + '">' +
          '<div class="ppm-detail-linked-label">' + _esc(item.label) + '</div>' +
          '<div class="ppm-detail-linked-sub">' + _esc(item.sub || '') + '</div>' +
        '</div>';
      }).join('');
      return '<div class="ppm-detail-linked-group">' +
        '<div class="ppm-detail-section-title">' + _esc(group.title) + '</div>' +
        itemsHtml +
      '</div>';
    }).join('');

    return '<div class="ppm-detail-section">' + sectionsHtml + '</div>';
  }

  // -------------------------------------------------------------------------
  // COMMENTS
  // -------------------------------------------------------------------------
  function _renderComments(commentList, table, rowId){
    var commentsHtml = commentList.map(function(c, i){
      return '<div class="ppm-comment">' +
        '<div class="ppm-comment-header">' +
          '<span class="ppm-comment-author">' + _esc(c.author || 'Anonymous') + '</span>' +
          '<span class="ppm-comment-date">' + _esc(_formatRelativeDate(c.date)) + '</span>' +
          '<button class="ppm-comment-delete" data-comment-idx="' + i + '" title="Delete">' + icons.close() + '</button>' +
        '</div>' +
        '<div class="ppm-comment-text">' + _esc(c.text) + '</div>' +
      '</div>';
    }).join('');

    return '<div class="ppm-detail-section ppm-detail-comments">' +
      '<div class="ppm-detail-section-title">Comments (' + commentList.length + ')</div>' +
      '<div class="ppm-comments-list" id="ppm-comments-list">' + commentsHtml + '</div>' +
      '<div class="ppm-comment-composer">' +
        '<textarea class="ppm-comment-input" placeholder="Add a comment…" id="ppm-comment-input"></textarea>' +
        '<button class="ppm-btn-tool ppm-btn-primary" id="ppm-comment-add">Add comment</button>' +
      '</div>' +
    '</div>';
  }

  function _formatRelativeDate(iso){
    if(!iso) return '';
    var then = new Date(iso);
    var now = new Date();
    var diffMs = now - then;
    var diffMin = Math.round(diffMs / 60000);
    if(diffMin < 1) return 'just now';
    if(diffMin < 60) return diffMin + 'm ago';
    var diffHr = Math.round(diffMin / 60);
    if(diffHr < 24) return diffHr + 'h ago';
    var diffDay = Math.round(diffHr / 24);
    if(diffDay < 30) return diffDay + 'd ago';
    return iso.split('T')[0];
  }

  // -------------------------------------------------------------------------
  // EVENT WIRING
  // -------------------------------------------------------------------------
  function _wireEvents(){
    var closeBtn = document.getElementById('ppm-detail-close');
    if(closeBtn) closeBtn.addEventListener('click', close);

    // Field edits — same path as grid (editService)
    document.querySelectorAll('[data-detail-field]').forEach(function(el){
      var commit = function(){
        var field = el.getAttribute('data-detail-field');
        var rowId = parseInt(el.getAttribute('data-detail-rowid'));
        var type = el.getAttribute('data-detail-type');
        var newVal = el.value;
        if(type === 'number'){
          newVal = newVal === '' ? null : parseFloat(newVal);
          if(isNaN(newVal)) newVal = null;
        }
        // Boolean-ish dropdowns
        if(newVal === 'true') newVal = true;
        else if(newVal === 'false') newVal = false;
        // P/I integers
        if(field === 'prob' || field === 'impact'){
          newVal = parseInt(newVal) || null;
        }
        var result = PPM.services.editService.applyCellEdit(currentTable, rowId, field, newVal);
        if(!result.ok){
          PPM.ui.toast.show('Edit rejected: ' + (result.message || result.error), 'error');
        }
      };
      el.addEventListener('change', commit);
      // For text inputs/textareas, also commit on blur
      if(el.tagName !== 'SELECT'){
        el.addEventListener('blur', commit);
      }
    });

    // Linked items navigate
    document.querySelectorAll('.ppm-detail-linked-item').forEach(function(el){
      el.addEventListener('click', function(){
        var t = el.getAttribute('data-link-table');
        var id = parseInt(el.getAttribute('data-link-id'));
        // Switch view if needed; then open detail
        if(PPM.ui.router.getView() !== t){
          PPM.ui.router.navigate(t);
          // After navigation, render runs and re-opens detail per per-view memory.
          // Override per-view memory so the linked target opens.
          lastOpenPerView[t] = id;
        }
        open(t, id);
      });
    });

    // Comment add
    var addBtn = document.getElementById('ppm-comment-add');
    var input = document.getElementById('ppm-comment-input');
    if(addBtn && input){
      var doAdd = function(){
        var text = input.value.trim();
        if(!text) return;
        var state = PPM.services.projectService.getState();
        var author = (state && state.meta && state.meta.pm) || 'You';
        var result = PPM.services.commentService.add(currentTable, currentRowId, text, author);
        if(result.ok){
          input.value = '';
          _render(); // re-render to show new comment
        } else {
          PPM.ui.toast.show('Could not add comment: ' + result.error, 'error');
        }
      };
      addBtn.addEventListener('click', doAdd);
      input.addEventListener('keydown', function(e){
        if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); doAdd(); }
      });
    }

    // Comment delete
    document.querySelectorAll('.ppm-comment-delete').forEach(function(btn){
      btn.addEventListener('click', function(){
        var idx = parseInt(btn.getAttribute('data-comment-idx'));
        if(!confirm('Delete this comment?')) return;
        var result = PPM.services.commentService.remove(currentTable, currentRowId, idx);
        if(result.ok){
          _render();
        } else {
          PPM.ui.toast.show('Could not delete: ' + result.error, 'error');
        }
      });
    });
  }

  function _esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // -------------------------------------------------------------------------
  // EVENT SUBSCRIPTIONS
  // -------------------------------------------------------------------------
  PPM.events.on('ui:view_changed', function(payload){
    // On view change, close current detail and (per spec) start view closed.
    // Per-view memory is honored: if a row was previously selected in this view,
    // detail re-opens for that row; otherwise detail stays closed.
    close();
    var memorized = lastOpenPerView[payload.to];
    if(memorized != null){
      var state = PPM.services.projectService.getState();
      var rows = state ? (state[payload.to] || []) : [];
      if(rows.find(function(r){ return r.id === memorized; })){
        // Defer slightly so grid renders first
        setTimeout(function(){ open(payload.to, memorized); }, 0);
      } else {
        // Memorized row no longer exists; clear memory
        lastOpenPerView[payload.to] = null;
      }
    }
  });

  PPM.events.on('state:changed', function(){
    if(currentTable && currentRowId != null){
      // Re-render to reflect any state changes (e.g., comment added elsewhere,
      // linked task status changed, etc.)
      var state = PPM.services.projectService.getState();
      if(state){
        var rows = state[currentTable] || [];
        if(rows.find(function(r){ return r.id === currentRowId; })){
          _render();
        } else {
          close();
        }
      }
    }
  });

  PPM.events.on('project:reset', close);

  PPM.ui.detail = Object.freeze({
    open:    open,
    close:   close,
    toggle:  toggle,
    isOpen:  isOpen
  });
})();
