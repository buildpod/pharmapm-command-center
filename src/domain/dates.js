/* ============================================================================
   File: src/domain/dates.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.domain.dates
   Dependencies: none (pure)
   Purpose: Centralized date handling. Domain never uses native `new Date()`
   directly. ISO-8601 strings are the canonical format. All math is explicit
   and DST-safe by operating on date components, not timestamps.
   ============================================================================ */
PPM.domain = PPM.domain || {};
(function(){

  // Parse ISO-8601 date-only string 'YYYY-MM-DD' into {y,m,d}
  function _parseISO(iso){
    if(!iso || typeof iso !== 'string') return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if(!m) return null;
    var y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if(mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return { y:y, m:mo, d:d };
  }

  // Format {y,m,d} back to ISO string
  function _formatISO(p){
    return p.y + '-' + ('0'+p.m).slice(-2) + '-' + ('0'+p.d).slice(-2);
  }

  // Convert ISO to UTC Date (at midnight UTC) — used for day-of-week and arithmetic
  function _toUTCDate(p){
    return new Date(Date.UTC(p.y, p.m - 1, p.d));
  }

  function _fromUTCDate(d){
    return { y:d.getUTCFullYear(), m:d.getUTCMonth() + 1, d:d.getUTCDate() };
  }

  // Validate an ISO date string (public)
  function isValidISO(iso){
    var p = _parseISO(iso);
    if(!p) return false;
    var dt = _toUTCDate(p);
    // Guards against e.g. 2026-02-31 -> normalizes to March
    return dt.getUTCFullYear() === p.y && (dt.getUTCMonth() + 1) === p.m && dt.getUTCDate() === p.d;
  }

  // Day of week in UTC (0=Sun..6=Sat)
  function dayOfWeek(iso){
    var p = _parseISO(iso);
    if(!p) return -1;
    return _toUTCDate(p).getUTCDay();
  }

  // Today in UTC as ISO string
  function today(){
    var d = new Date();
    return _formatISO({
      y: d.getUTCFullYear(),
      m: d.getUTCMonth() + 1,
      d: d.getUTCDate()
    });
  }

  // ISO datetime (now)
  function nowISO(){
    return new Date().toISOString();
  }

  // Add N calendar days (DST-safe because we operate in UTC)
  function addDays(iso, days){
    var p = _parseISO(iso);
    if(!p) return null;
    var dt = _toUTCDate(p);
    dt.setUTCDate(dt.getUTCDate() + days);
    return _formatISO(_fromUTCDate(dt));
  }

  // Add N working days (Mon–Fri by default, or custom workingDays array)
  // workingDays default: [1,2,3,4,5] (Mon–Fri)
  function addWorkingDays(iso, days, workingDays){
    var wd = workingDays || [1,2,3,4,5];
    var current = iso;
    var added = 0;
    var guard = 0;
    while(added < days){
      current = addDays(current, 1);
      guard++;
      if(guard > 10000){ return null; } // Safety
      if(wd.indexOf(dayOfWeek(current)) >= 0) added++;
    }
    return current;
  }

  // Calendar-day difference between two ISO dates
  function daysBetween(a, b){
    var pa = _parseISO(a), pb = _parseISO(b);
    if(!pa || !pb) return 0;
    var ms = _toUTCDate(pb).getTime() - _toUTCDate(pa).getTime();
    return Math.round(ms / 86400000);
  }

  // Compare two ISO dates. Returns -1 / 0 / 1
  function compare(a, b){
    var pa = _parseISO(a), pb = _parseISO(b);
    if(!pa || !pb) return 0;
    var ta = _toUTCDate(pa).getTime();
    var tb = _toUTCDate(pb).getTime();
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  }

  // Public API — frozen
  PPM.domain.dates = Object.freeze({
    isValidISO:     isValidISO,
    dayOfWeek:      dayOfWeek,
    today:          today,
    nowISO:         nowISO,
    addDays:        addDays,
    addWorkingDays: addWorkingDays,
    daysBetween:    daysBetween,
    compare:        compare
  });
})();
