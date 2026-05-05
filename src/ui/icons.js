/* ============================================================================
   File: src/ui/icons.js
   Loaded as a classic <script> tag in dependency order from index.html.
   Dependencies: PPM (root namespace)
   Exports: PPM.ui.icons.{name}() -> SVG string
   ============================================================================ */

(function(){
  PPM.ui = PPM.ui || {};

  // Lucide-style icons. Stroke-width 2 throughout. 16x16 default size.
  // Each function returns an SVG string. Caller can override class via 2nd arg.
  function svg(path, cls){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' + (cls || 'icon') + '">' + path + '</svg>';
  }

  var icons = {
    plan:        function(c){ return svg('<polyline points="9 11 12 14 20 6"/><path d="M20 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h11"/>', c); },
    milestones:  function(c){ return svg('<polyline points="9 11 12 14 20 6"/><path d="M20 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h11"/>', c); },
    tasks:       function(c){ return svg('<rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="11" width="18" height="4" rx="1"/><rect x="3" y="18" width="18" height="2" rx="1"/>', c); },
    risks:       function(c){ return svg('<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>', c); },
    documents:   function(c){ return svg('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>', c); },
    costs:       function(c){ return svg('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>', c); },
    dashboard:   function(c){ return svg('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>', c); },
    steerco:     function(c){ return svg('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>', c); },
    download:    function(c){ return svg('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', c); },
    upload:      function(c){ return svg('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', c); },
    plus:        function(c){ return svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', c); },
    close:       function(c){ return svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', c); },
    menu:        function(c){ return svg('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>', c); },
    chevronRight:function(c){ return svg('<polyline points="9 18 15 12 9 6"/>', c); },
    chevronDown: function(c){ return svg('<polyline points="6 9 12 15 18 9"/>', c); },
    arrowRight:  function(c){ return svg('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>', c); },
    arrowLeft:   function(c){ return svg('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>', c); },
    print:       function(c){ return svg('<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>', c); },
    info:        function(c){ return svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>', c); },
    warning:     function(c){ return svg('<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>', c); },
    check:       function(c){ return svg('<polyline points="20 6 9 17 4 12"/>', c); },
    clock:       function(c){ return svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', c); },
    folder:      function(c){ return svg('<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>', c); },
    sparkles:    function(c){ return svg('<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75z"/>', c); },
    calendar:    function(c){ return svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', c); }
  };

  PPM.ui.icons = Object.freeze(icons);
})();
