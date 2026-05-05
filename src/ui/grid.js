/* ============================================================================
   File: src/ui/grid.js
   Dependencies: PPM.ui.columns, PPM.ui.detail, PPM.ui.toast, PPM.ui.icons,
                 PPM.services.projectService, PPM.services.editService,
                 PPM.services.commentService, PPM.services.viewService,
                 PPM.events
   Exports: PPM.ui.grid.{render, refresh}

   ARCHITECTURE: UI consumes services only. No direct domain or adapter access.
   All computed display values come from PPM.services.viewService.

   Rules followed:
   - 40px row height (default density per spec Section 7)
   - Tabular nums on numeric columns
   - Muted badges in tables (Section 7 Exception 1)
   - Exception-first sort default: Blocked → Delayed → In Progress → Not Started → Complete
   - Row accents: left border for blocked, delayed, unforeseen
   - Click-to-edit: cell click swaps to input/select
   - Edits route through editService.applyCellEdit (immutability guards apply)
   - Cascade triggers automatically for milestone schedule edits
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};
  var icons = PPM.ui.icons;

  // Per-table state: sort key/direction, filter text, per-column filters, selected row id
  // colFilters: { columnKey: { activeValues: Set-like object {value: true, ...} } }
  // Empty/missing colFilters[k] = no filter for that column.
  var gridState = {
    milestones: { sortKey: null, sortDir: 'asc', filter: '', colFilters: {}, selectedId: null },
    tasks:      { sortKey: null, sortDir: 'asc', filter: '', colFilters: {}, selectedId: null },
    risks:      { sortKey: null, sortDir: 'asc', filter: '', colFilters: {}, selectedId: null },
    documents:  { sortKey: null, sortDir: 'asc', filter: '', colFilters: {}, selectedId: null },
    costs:      { sortKey: null, sortDir: 'asc', filter: '', colFilters: {}, selectedId: null }
  };

  // Status priority maps (lower = sort first when "exception-first" is on)
  var STATUS_PRIORITY = {
    'Blocked': 0,
    'Delayed': 1,
    'In Progress': 2,
    'In Review': 2,
    'In Draft': 3,
    'Not Started': 4,
    'On Hold': 5,
    'Open': 0,        // risks: open is exception
    'Monitoring': 2,
    'Escalated': 0,
    'Approved': 5,
    'Complete': 6,
    'Closed': 6,
    'N/A': 7
  };

  function statusRank(status){
    if(STATUS_PRIORITY[status] != null) return STATUS_PRIORITY[status];
    return 8;
  }

  // -------------------------------------------------------------------------
  // PUBLIC API
  // -------------------------------------------------------------------------
  function render(table){
    var content = document.getElementById('ppm-content');
    if(!content) return;
    var state = PPM.services.projectService.getState();
    if(!state){ return; }

    var cols = PPM.ui.columns.get(table);
    if(!cols.length){
      content.innerHTML = '<div class="ppm-empty-view"><div class="ppm-empty-title">Unknown view</div></div>';
      return;
    }

    var rows = (state[table] || []).slice();
    rows = _enrichRows(table, rows, state);
    rows = _filterRows(rows, gridState[table].filter, gridState[table].colFilters, cols);
    rows = _sortRows(rows, gridState[table].sortKey, gridState[table].sortDir, cols);

    content.innerHTML =
      _renderToolbar(table, rows.length, (state[table] || []).length) +
      _renderGrid(table, cols, rows);

    _wireToolbar(table);
    _wireGrid(table, cols);

    // If detail pane was open for this view, restore it
    if(gridState[table].selectedId != null){
      var row = rows.find(function(r){ return r.id === gridState[table].selectedId; });
      if(row && PPM.ui.detail) PPM.ui.detail.open(table, row.id);
    }
  }

  function refresh(){
    var view = PPM.ui.router.getView();
    if(['milestones','tasks','risks','documents','costs'].indexOf(view) >= 0){
      render(view);
    }
  }

  // -------------------------------------------------------------------------
  // ROW PROCESSING
  // -------------------------------------------------------------------------
  // Delegates all derived/computed values to viewService. UI never calls
  // PPM.domain.* directly. This is also where the previous correctness bugs
  // were hiding: viewService.enrichRows passes the row object to computeRAG
  // and computeScore (one row at a time, full object) — the way the domain
  // API was actually defined.
  function _enrichRows(table, rows, state){
    return PPM.services.viewService.enrichRows(table, rows, state);
  }

  function _filterRows(rows, filter, colFilters, cols){
    var filtered = rows;

    // Step 1: per-column filters (AND across columns)
    if(colFilters && Object.keys(colFilters).length > 0){
      filtered = filtered.filter(function(r){
        return Object.keys(colFilters).every(function(colKey){
          var active = colFilters[colKey];
          if(!active || Object.keys(active).length === 0) return true;
          var v = r[colKey];
          var displayVal = (v == null || v === '') ? '(empty)' : String(v);
          return active[displayVal] === true;
        });
      });
    }

    // Step 2: global text filter (across all columns)
    if(filter){
      var needle = filter.toLowerCase();
      filtered = filtered.filter(function(r){
        return cols.some(function(c){
          var v = r[c.key];
          if(v == null) return false;
          return String(v).toLowerCase().indexOf(needle) >= 0;
        });
      });
    }

    return filtered;
  }

  function _sortRows(rows, sortKey, sortDir, cols){
    if(!sortKey){
      // Exception-first default sort by status (or unforeseen + score for risks)
      return rows.sort(function(a, b){
        if(a.unforeseen && !b.unforeseen) return -1;
        if(!a.unforeseen && b.unforeseen) return 1;
        var rankA = statusRank(a.status);
        var rankB = statusRank(b.status);
        if(rankA !== rankB) return rankA - rankB;
        // Secondary: score for risks, end date for milestones, id otherwise
        if(a._score != null && b._score != null) return b._score - a._score;
        if(a.plannedEnd && b.plannedEnd) return a.plannedEnd.localeCompare(b.plannedEnd);
        return (a.id || 0) - (b.id || 0);
      });
    }
    var col = cols.find(function(c){ return c.key === sortKey; }) || {};
    var multiplier = sortDir === 'desc' ? -1 : 1;
    return rows.sort(function(a, b){
      var av = a[sortKey];
      var bv = b[sortKey];
      if(av == null && bv == null) return 0;
      if(av == null) return 1;
      if(bv == null) return -1;
      if(col.num || col.type === 'number'){
        return (parseFloat(av) - parseFloat(bv)) * multiplier;
      }
      return String(av).localeCompare(String(bv)) * multiplier;
    });
  }

  // -------------------------------------------------------------------------
  // TOOLBAR
  // -------------------------------------------------------------------------
  function _renderToolbar(table, shownCount, totalCount){
    var s = gridState[table];
    var filterShown = s.filter ? '<span class="ppm-grid-filter-active">Filtering: "' + _esc(s.filter) + '"</span>' : '';
    var clearSort = s.sortKey ? '<button class="ppm-grid-pill" id="ppm-clear-sort">Clear sort: ' + _esc(s.sortKey) + '</button>' : '';
    // FRS-005: backward scheduling action — only on milestones table.
    var bwButton = (table === 'milestones')
      ? '<button class="ppm-btn-tool" id="ppm-grid-bw" title="Re-anchor schedule so terminal milestone lands on go-live date">' + icons.calendar() + '<span class="ppm-btn-label">Schedule from Go-Live</span></button>'
      : '';
    return '<div class="ppm-grid-toolbar">' +
      '<div class="ppm-grid-toolbar-left">' +
        '<input class="ppm-grid-filter" type="text" placeholder="Filter…" value="' + _esc(s.filter) + '" id="ppm-grid-filter-input">' +
        clearSort +
        filterShown +
      '</div>' +
      '<div class="ppm-grid-toolbar-right">' +
        '<span class="ppm-grid-count">' + shownCount + (shownCount !== totalCount ? ' of ' + totalCount : '') + ' rows</span>' +
        bwButton +
        '<button class="ppm-btn-tool" id="ppm-grid-add">' + icons.plus() + '<span class="ppm-btn-label">Add row</span></button>' +
      '</div>' +
    '</div>';
  }

  function _wireToolbar(table){
    var input = document.getElementById('ppm-grid-filter-input');
    if(input){
      var debounce;
      input.addEventListener('input', function(e){
        clearTimeout(debounce);
        var val = e.target.value;
        debounce = setTimeout(function(){
          gridState[table].filter = val;
          render(table);
          // Restore focus to input
          var newInput = document.getElementById('ppm-grid-filter-input');
          if(newInput){
            newInput.focus();
            newInput.setSelectionRange(val.length, val.length);
          }
        }, 200);
      });
    }
    var clearSort = document.getElementById('ppm-clear-sort');
    if(clearSort){
      clearSort.addEventListener('click', function(){
        gridState[table].sortKey = null;
        gridState[table].sortDir = 'asc';
        render(table);
      });
    }
    var addBtn = document.getElementById('ppm-grid-add');
    if(addBtn){
      addBtn.addEventListener('click', function(){
        var defaults = PPM.ui.columns.newRowDefaults(table);
        var result = PPM.services.editService.addRow(table, defaults);
        if(result.ok){
          gridState[table].selectedId = result.row.id;
          PPM.ui.toast.show('Row added', 'success');
        }
      });
    }
    // FRS-005: backward schedule from go-live (milestones grid only)
    var bwBtn = document.getElementById('ppm-grid-bw');
    if(bwBtn){
      bwBtn.addEventListener('click', function(){
        var state = PPM.services.projectService.getState();
        if(!state || !state.meta || !state.meta.goLive){
          PPM.ui.toast.show('Set a go-live date in project meta first', 'error', 4000);
          return;
        }
        var msg = 'Re-anchor the schedule so the terminal milestone lands on ' + state.meta.goLive +
                  '?\n\nThis will rewrite all milestone start and end dates working backward through dependencies. Existing dates will be replaced.';
        if(!confirm(msg)) return;
        var result = PPM.services.projectService.scheduleBackwardFromGoLive();
        if(result.ok){
          PPM.ui.toast.show('Schedule anchored to ' + result.anchor + ' (' + result.milestoneCount + ' milestones)', 'success', 4000);
        } else {
          PPM.ui.toast.show('Backward scheduling failed: ' + result.error, 'error', 4000);
        }
      });
    }
  }

  // -------------------------------------------------------------------------
  // GRID RENDERING
  // -------------------------------------------------------------------------
  function _renderGrid(table, cols, rows){
    if(rows.length === 0){
      return '<div class="ppm-grid-wrap">' +
        '<div class="ppm-grid-empty">' +
          '<div class="ppm-grid-empty-title">No rows yet</div>' +
          '<div class="ppm-grid-empty-desc">Click <strong>Add row</strong> in the toolbar to create your first ' +
            (PPM.ui.router.getViewMeta(table) || {}).singular + '.</div>' +
        '</div>' +
      '</div>';
    }

    var headerHtml = cols.map(function(c){
      var s = gridState[table];
      var sortClass = '';
      var sortMark = '';
      if(s.sortKey === c.key){
        sortClass = ' ppm-grid-th-sorted';
        sortMark = '<span class="ppm-grid-sort-mark">' + (s.sortDir === 'asc' ? '↑' : '↓') + '</span>';
      }
      var alignClass = c.num ? ' ppm-num-col' : '';
      var widthAttr = c.w ? ' style="width:' + c.w + 'px;min-width:' + c.w + 'px"' : '';
      var canSort = c.type !== 'computed' && c.type !== 'auto';
      // FRS: filter icon — show on every column. Highlight when active.
      var hasActiveFilter = s.colFilters[c.key] && Object.keys(s.colFilters[c.key]).length > 0;
      var filterIconClass = 'ppm-grid-filter-icon' + (hasActiveFilter ? ' ppm-grid-filter-icon-active' : '');
      var filterIcon = '<button class="' + filterIconClass + '" data-filter-col="' + _esc(c.key) + '" title="Filter ' + _esc(c.label) + '" aria-label="Filter">▾</button>';

      return '<th class="ppm-grid-th' + sortClass + alignClass + (canSort ? ' ppm-grid-th-sortable' : '') + '" ' +
        'data-col-key="' + _esc(c.key) + '"' + widthAttr + '>' +
        '<span class="ppm-grid-th-label">' + _esc(c.label) + sortMark + '</span>' +
        filterIcon +
      '</th>';
    }).join('');

    var bodyHtml = rows.map(function(r){
      return _renderRow(table, cols, r);
    }).join('');

    return '<div class="ppm-grid-wrap">' +
      '<table class="ppm-grid">' +
        '<thead><tr class="ppm-grid-header">' + headerHtml + '</tr></thead>' +
        '<tbody class="ppm-grid-body">' + bodyHtml + '</tbody>' +
      '</table>' +
    '</div>';
  }

  function _renderRow(table, cols, r){
    var rowAccent = '';
    var rowClasses = ['ppm-grid-row'];
    if(r.status === 'Blocked')      { rowClasses.push('ppm-row-accent-red'); }
    else if(r.status === 'Delayed') { rowClasses.push('ppm-row-accent-amber'); }
    else if(r.unforeseen === true)  { rowClasses.push('ppm-row-accent-amber'); }
    if(gridState[table].selectedId === r.id){ rowClasses.push('ppm-grid-row-selected'); }

    var cellsHtml = cols.map(function(c){
      return _renderCell(table, c, r);
    }).join('');

    return '<tr class="' + rowClasses.join(' ') + '" data-row-id="' + r.id + '">' + cellsHtml + '</tr>';
  }

  function _renderCell(table, c, r){
    var val = r[c.key];
    var alignClass = c.num ? ' ppm-num' : '';
    var contentHtml = '';

    if(c.type === 'auto' || c.immutable){
      contentHtml = _esc(val == null ? '' : String(val));
    } else if(c.type === 'computed'){
      contentHtml = _renderComputedCell(table, c.key, r);
    } else if(c.type === 'dropdown' && (c.key === 'status' || c.key === '_status')){
      contentHtml = _renderStatusBadge(val);
    } else if(c.type === 'date'){
      contentHtml = val ? _esc(val) : '<span class="ppm-cell-placeholder">—</span>';
    } else if(c.type === 'number'){
      if(c.key === 'pct'){
        contentHtml = _renderPctBar(val);
      } else if(val == null || val === ''){
        contentHtml = '<span class="ppm-cell-placeholder">—</span>';
      } else {
        contentHtml = _esc(String(val));
      }
    } else {
      contentHtml = (val == null || val === '')
        ? '<span class="ppm-cell-placeholder">—</span>'
        : _esc(String(val));
    }

    var dataAttrs = ' data-col-key="' + _esc(c.key) + '" data-col-type="' + c.type + '"';
    var editableClass = (c.type === 'auto' || c.type === 'computed' || c.immutable) ? '' : ' ppm-cell-editable';

    return '<td class="ppm-grid-cell' + alignClass + editableClass + '"' + dataAttrs + '>' + contentHtml + '</td>';
  }

  function _renderComputedCell(table, key, r){
    if(table === 'milestones' && key === '_rag'){
      var rag = r._rag || 'Green';
      return '<span class="ppm-status-badge ppm-status-' + rag.toLowerCase() + '">' + rag + '</span>';
    }
    if(table === 'milestones' && key === '_depStatus'){
      var dep = r._depStatus || 'Clear';
      // Map dep status to existing status colour bands: Clear=green, Waiting=amber, Blocked=red
      var depClass = dep === 'Clear' ? 'green' : (dep === 'Waiting' ? 'amber' : 'red');
      return '<span class="ppm-status-badge ppm-status-' + depClass + '">' + dep + '</span>';
    }
    if(table === 'risks' && key === '_score'){
      var band = r._scoreBand || 'low';
      return '<span class="ppm-status-badge ppm-status-' + band + '">' + (r._score || 0) + '</span>';
    }
    if(table === 'costs' && key === '_burn'){
      return '<span class="ppm-num">' + (r._burn || 0) + '%</span>';
    }
    if(table === 'costs' && key === '_cost'){
      return '<span class="ppm-num">€' + Number(r._cost || 0).toLocaleString() + '</span>';
    }
    if(table === 'costs' && key === '_budgetRag'){
      var budgetBand = r._budgetRag || 'green';
      return '<span class="ppm-status-badge ppm-status-' + budgetBand + '">' + budgetBand.toUpperCase() + '</span>';
    }
    if(table === 'tasks' && key === '_variance'){
      var v = r._variance || 0;
      var sign = v > 0 ? '+' : '';
      var cls = v > 20 ? 'ppm-text-red' : (v > 0 ? 'ppm-text-amber' : '');
      return '<span class="ppm-num ' + cls + '">' + sign + v + '%</span>';
    }
    return '';
  }

  function _renderStatusBadge(val){
    if(val == null) return '<span class="ppm-cell-placeholder">—</span>';
    var key = String(val).toLowerCase().replace(/\s+/g,'-');
    return '<span class="ppm-status-badge ppm-status-' + key + '">' + _esc(String(val)) + '</span>';
  }

  function _renderPctBar(val){
    var pct = Math.max(0, Math.min(100, parseInt(val) || 0));
    return '<span class="ppm-pct-cell">' +
      '<span class="ppm-pct-bar"><span class="ppm-pct-fill" style="width:' + pct + '%"></span></span>' +
      '<span class="ppm-pct-label ppm-num">' + pct + '%</span>' +
    '</span>';
  }

  // -------------------------------------------------------------------------
  // GRID EVENT WIRING
  // -------------------------------------------------------------------------
  function _wireGrid(table, cols){
    // Sort by column header click — but NOT when click came from the filter icon
    document.querySelectorAll('.ppm-grid-th-sortable').forEach(function(th){
      th.addEventListener('click', function(e){
        // Skip if click originated on or inside the filter icon
        if(e.target.closest('.ppm-grid-filter-icon')) return;
        var key = e.currentTarget.getAttribute('data-col-key');
        var s = gridState[table];
        if(s.sortKey === key){
          s.sortDir = s.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          s.sortKey = key;
          s.sortDir = 'asc';
        }
        render(table);
      });
    });

    // Filter icon click — open filter dropdown for that column
    document.querySelectorAll('.ppm-grid-filter-icon').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var colKey = btn.getAttribute('data-filter-col');
        var col = cols.find(function(c){ return c.key === colKey; });
        if(!col) return;
        _showColumnFilter(table, col, btn);
      });
    });

    // Row click (selects + opens detail pane)
    document.querySelectorAll('.ppm-grid-row').forEach(function(tr){
      tr.addEventListener('click', function(e){
        // If we're already editing a cell, ignore
        if(e.target.closest('.ppm-cell-editor-wrap')) return;
        // If clicked an editable cell (not yet in edit mode), let the cell handler take over
        if(e.target.classList.contains('ppm-cell-editable')) return;

        var id = parseInt(tr.getAttribute('data-row-id'));
        gridState[table].selectedId = id;
        if(PPM.ui.detail) PPM.ui.detail.open(table, id);
        // Update visual selection
        document.querySelectorAll('.ppm-grid-row-selected').forEach(function(r){
          r.classList.remove('ppm-grid-row-selected');
        });
        tr.classList.add('ppm-grid-row-selected');
      });
    });

    // Cell click — start edit
    document.querySelectorAll('.ppm-cell-editable').forEach(function(td){
      td.addEventListener('click', function(e){
        e.stopPropagation();
        if(td.classList.contains('ppm-cell-editing')) return;
        var rowId = parseInt(td.closest('tr').getAttribute('data-row-id'));
        var colKey = td.getAttribute('data-col-key');
        var col = cols.find(function(c){ return c.key === colKey; });
        if(!col) return;
        _startEdit(table, td, rowId, col);
      });
    });
  }

  // -------------------------------------------------------------------------
  // CELL EDITING
  // -------------------------------------------------------------------------
  function _startEdit(table, td, rowId, col){
    var state = PPM.services.projectService.getState();
    var row = (state[table] || []).find(function(r){ return r.id === rowId; });
    if(!row) return;

    var currentValue = row[col.key];
    if(currentValue == null) currentValue = '';

    td.classList.add('ppm-cell-editing');
    td.innerHTML = ''; // clear contents

    var wrap = document.createElement('div');
    wrap.className = 'ppm-cell-editor-wrap';

    var editor;
    if(col.type === 'dropdown'){
      editor = document.createElement('select');
      editor.className = 'ppm-cell-editor';
      var options = col.options || [];
      options.forEach(function(opt){
        var optEl = document.createElement('option');
        optEl.value = opt;
        optEl.textContent = opt;
        if(String(currentValue) === String(opt)) optEl.selected = true;
        editor.appendChild(optEl);
      });
    } else if(col.type === 'date'){
      editor = document.createElement('input');
      editor.type = 'date';
      editor.className = 'ppm-cell-editor';
      editor.value = currentValue || '';
    } else if(col.type === 'number'){
      editor = document.createElement('input');
      editor.type = 'number';
      editor.className = 'ppm-cell-editor ppm-num';
      editor.value = currentValue;
    } else {
      editor = document.createElement('input');
      editor.type = 'text';
      editor.className = 'ppm-cell-editor';
      editor.value = currentValue;
    }

    wrap.appendChild(editor);
    td.appendChild(wrap);
    editor.focus();
    if(editor.select) editor.select();

    var commit = function(){
      var newVal = editor.value;
      // Type coercion for number
      if(col.type === 'number'){
        newVal = newVal === '' ? null : parseFloat(newVal);
        if(isNaN(newVal)) newVal = null;
      }
      // Type coercion for unforeseen and similar boolean dropdowns
      if(col.type === 'dropdown' && col.options && col.options.length === 2 && col.options.indexOf('true') >= 0){
        newVal = newVal === 'true';
      }
      // P/I score columns expect integers
      if(col.key === 'prob' || col.key === 'impact'){
        newVal = parseInt(newVal) || null;
      }
      // Save only if changed
      if(String(newVal) !== String(currentValue)){
        // FRS-005c: cascade preview for schedule-affecting milestone edits.
        // Show confirm modal if downstream milestones would shift.
        if(table === 'milestones' && ['plannedStart','plannedEnd','duration','predecessor','lag'].indexOf(col.key) >= 0){
          var state = PPM.services.projectService.getState();
          var settings = PPM.services.settingsService.getSettings() || {};
          var preview = PPM.services.viewService.previewCascade(
            state.milestones,
            { id: rowId, field: col.key, value: newVal },
            settings.workingDays,
            settings.holidays
          );
          if(preview.error){
            PPM.ui.toast.show('Cannot apply: ' + preview.error, 'error', 4000);
            render(table);
            return;
          }
          if(preview.affected && preview.affected.length > 0){
            _showCascadePreview(preview.affected, function(confirmed){
              if(confirmed){
                var result = PPM.services.editService.applyCellEdit(table, rowId, col.key, newVal);
                if(!result.ok){
                  PPM.ui.toast.show('Edit rejected: ' + (result.message || result.error), 'error', 3500);
                } else {
                  PPM.ui.toast.show(preview.affected.length + ' downstream milestone' + (preview.affected.length === 1 ? '' : 's') + ' shifted', 'info', 3000);
                }
              }
              render(table);
            });
            return; // wait for modal — render happens in callback
          }
        }
        // Non-schedule edit, or schedule edit with no downstream impact
        var result = PPM.services.editService.applyCellEdit(table, rowId, col.key, newVal);
        if(!result.ok){
          PPM.ui.toast.show('Edit rejected: ' + (result.message || result.error), 'error', 3500);
        }
      }
      // Re-render the grid (state:changed event also triggers refresh)
      render(table);
    };

    var cancel = function(){
      render(table);
    };

    editor.addEventListener('blur', commit);
    editor.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); commit(); }
      else if(e.key === 'Escape'){ e.preventDefault(); cancel(); }
    });
    // For select, change auto-commits
    if(editor.tagName === 'SELECT'){
      editor.addEventListener('change', commit);
    }
  }

  function _esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // -------------------------------------------------------------------------
  // COLUMN FILTER DROPDOWN
  // Lists distinct values in the column. User toggles which to include.
  // No selections = show all. Anchored to the clicked filter icon.
  // -------------------------------------------------------------------------
  function _showColumnFilter(table, col, anchorEl){
    // Close any existing filter dropdown
    var existing = document.getElementById('ppm-colfilter-popup');
    if(existing) existing.parentNode.removeChild(existing);

    // Compute distinct values from the current state (enriched, like grid sees)
    var state = PPM.services.projectService.getState();
    if(!state) return;
    var rows = (state[table] || []).slice();
    rows = PPM.services.viewService.enrichRows(table, rows, state);

    var seen = {};
    var distinct = [];
    rows.forEach(function(r){
      var v = r[col.key];
      var label = (v == null || v === '') ? '(empty)' : String(v);
      if(!seen[label]){
        seen[label] = true;
        distinct.push(label);
      }
    });
    distinct.sort();
    if(distinct.length === 0){
      PPM.ui.toast.show('No values to filter on', 'info');
      return;
    }

    var active = gridState[table].colFilters[col.key] || {};
    var hasAny = Object.keys(active).length > 0;

    var checkboxRows = distinct.map(function(label){
      var checked = hasAny ? (active[label] === true) : true; // default: all on
      return '<label class="ppm-colfilter-item">' +
        '<input type="checkbox" data-filter-value="' + _esc(label) + '"' + (checked ? ' checked' : '') + '>' +
        '<span class="ppm-colfilter-label">' + _esc(label) + '</span>' +
      '</label>';
    }).join('');

    var popup = document.createElement('div');
    popup.id = 'ppm-colfilter-popup';
    popup.className = 'ppm-colfilter-popup';
    popup.innerHTML =
      '<div class="ppm-colfilter-header">' +
        '<span class="ppm-colfilter-title">Filter ' + _esc(col.label) + '</span>' +
        '<button class="ppm-colfilter-close" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="ppm-colfilter-actions">' +
        '<button class="ppm-colfilter-action" data-action="all">Select all</button>' +
        '<button class="ppm-colfilter-action" data-action="none">Clear</button>' +
      '</div>' +
      '<div class="ppm-colfilter-list">' + checkboxRows + '</div>' +
      '<div class="ppm-colfilter-footer">' +
        '<button class="ppm-btn-tool" data-action="cancel">Cancel</button>' +
        '<button class="ppm-btn-tool ppm-btn-primary" data-action="apply">Apply</button>' +
      '</div>';
    document.body.appendChild(popup);

    // Position near the anchor (right-aligned to avoid going off-screen)
    var rect = anchorEl.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.top = (rect.bottom + 4) + 'px';
    var left = rect.right - 240;
    if(left < 8) left = 8;
    popup.style.left = left + 'px';

    var cleanup = function(){
      if(popup.parentNode) popup.parentNode.removeChild(popup);
      document.removeEventListener('click', outsideClick, true);
      document.removeEventListener('keydown', escHandler);
    };
    var outsideClick = function(e){
      if(!popup.contains(e.target)) cleanup();
    };
    var escHandler = function(e){
      if(e.key === 'Escape') cleanup();
    };
    setTimeout(function(){ // defer so the click that opened doesn't immediately close
      document.addEventListener('click', outsideClick, true);
      document.addEventListener('keydown', escHandler);
    }, 0);

    popup.querySelector('.ppm-colfilter-close').addEventListener('click', cleanup);
    popup.querySelector('[data-action="cancel"]').addEventListener('click', cleanup);
    popup.querySelector('[data-action="all"]').addEventListener('click', function(){
      popup.querySelectorAll('input[type=checkbox]').forEach(function(cb){ cb.checked = true; });
    });
    popup.querySelector('[data-action="none"]').addEventListener('click', function(){
      popup.querySelectorAll('input[type=checkbox]').forEach(function(cb){ cb.checked = false; });
    });
    popup.querySelector('[data-action="apply"]').addEventListener('click', function(){
      var newFilter = {};
      var allChecked = true;
      popup.querySelectorAll('input[type=checkbox]').forEach(function(cb){
        if(cb.checked){
          newFilter[cb.getAttribute('data-filter-value')] = true;
        } else {
          allChecked = false;
        }
      });
      // If all checkboxes are checked, treat as "no filter" (clearer semantics)
      if(allChecked){
        delete gridState[table].colFilters[col.key];
      } else {
        gridState[table].colFilters[col.key] = newFilter;
      }
      cleanup();
      render(table);
    });
  }

  // -------------------------------------------------------------------------
  // CASCADE PREVIEW MODAL (FRS-005c)
  // Shows what would shift before committing a schedule edit.
  // Caller passes affected[] from viewService.previewCascade and a callback
  // that receives boolean confirmed.
  // -------------------------------------------------------------------------
  function _showCascadePreview(affected, callback){
    // Remove any prior modal
    var existing = document.getElementById('ppm-cascade-modal');
    if(existing) existing.parentNode.removeChild(existing);

    var rows = affected.slice(0, 8).map(function(a){
      var shiftLabel = (a.daysShifted > 0 ? '+' : '') + a.daysShifted + 'd';
      var shiftClass = a.daysShifted > 0 ? 'ppm-cascade-shift-fwd' : (a.daysShifted < 0 ? 'ppm-cascade-shift-back' : '');
      return '<tr>' +
        '<td>' + _esc(a.name || ('#' + a.id)) + '</td>' +
        '<td class="ppm-num">' + _esc(a.oldStart || '—') + '</td>' +
        '<td class="ppm-num">' + _esc(a.newStart || '—') + '</td>' +
        '<td class="ppm-num">' + _esc(a.oldEnd || '—') + '</td>' +
        '<td class="ppm-num">' + _esc(a.newEnd || '—') + '</td>' +
        '<td class="ppm-num ' + shiftClass + '">' + shiftLabel + '</td>' +
      '</tr>';
    }).join('');
    var more = affected.length > 8 ? '<div class="ppm-cascade-more">+ ' + (affected.length - 8) + ' more downstream milestones</div>' : '';

    var modal = document.createElement('div');
    modal.id = 'ppm-cascade-modal';
    modal.className = 'ppm-cascade-overlay';
    modal.innerHTML =
      '<div class="ppm-cascade-dialog" role="dialog" aria-labelledby="ppm-cascade-title">' +
        '<div class="ppm-cascade-header">' +
          '<h3 id="ppm-cascade-title" class="ppm-cascade-title">Schedule cascade preview</h3>' +
          '<div class="ppm-cascade-subtitle">This change will shift ' + affected.length + ' downstream milestone' + (affected.length === 1 ? '' : 's') + '. Review the impact below.</div>' +
        '</div>' +
        '<div class="ppm-cascade-body">' +
          '<table class="ppm-cascade-table">' +
            '<thead><tr><th>Milestone</th><th>Old Start</th><th>New Start</th><th>Old End</th><th>New End</th><th>Shift</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
          more +
        '</div>' +
        '<div class="ppm-cascade-footer">' +
          '<button class="ppm-btn-tool" id="ppm-cascade-cancel">Cancel</button>' +
          '<button class="ppm-btn-tool ppm-btn-primary" id="ppm-cascade-confirm">Apply changes</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    var cleanup = function(confirmed){
      if(modal.parentNode) modal.parentNode.removeChild(modal);
      callback(confirmed);
    };
    document.getElementById('ppm-cascade-cancel').addEventListener('click', function(){ cleanup(false); });
    document.getElementById('ppm-cascade-confirm').addEventListener('click', function(){ cleanup(true); });
    modal.addEventListener('click', function(e){ if(e.target === modal) cleanup(false); });
    document.addEventListener('keydown', function escHandler(e){
      if(e.key === 'Escape'){
        document.removeEventListener('keydown', escHandler);
        cleanup(false);
      }
    });

    // Focus the confirm button by default for keyboard users
    setTimeout(function(){
      var btn = document.getElementById('ppm-cascade-confirm');
      if(btn) btn.focus();
    }, 50);
  }

  // -------------------------------------------------------------------------
  // EVENT SUBSCRIPTIONS
  // -------------------------------------------------------------------------
  PPM.events.on('ui:view_changed', function(payload){
    if(['milestones','tasks','risks','documents','costs'].indexOf(payload.to) >= 0){
      render(payload.to);
    }
  });
  PPM.events.on('state:changed', function(){
    refresh();
  });

  PPM.ui.grid = Object.freeze({
    render:  render,
    refresh: refresh
  });
})();
