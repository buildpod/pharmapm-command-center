/* ============================================================================
   File: src/adapters/storage.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.adapters.storage
   Dependencies: PPM.domain.validation, PPM.migrations
   Persistence contract (see ADR-001):
     save(state) -> { ok, error?, message? }
     load()      -> { ok, state, error?, message? }
     clear()     -> { ok, error? }
   Any backend adapter in v2 must implement this interface.
   ============================================================================ */
PPM.adapters = PPM.adapters || {};
(function(){
  var KEY = 'ppm_state';

  function save(state){
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return { ok:true };
    } catch(e){
      return {
        ok: false,
        error: e.name === 'QuotaExceededError' ? 'quota' : 'unknown',
        message: e.message
      };
    }
  }

  function load(){
    try {
      var raw = localStorage.getItem(KEY);
      if(!raw) return { ok:true, state:null };
      var parsed = JSON.parse(raw);

      // Migration check
      if(parsed.schemaVersion !== PPM.schema.CURRENT_VERSION){
        var mig = PPM.migrations.migrate(parsed);
        if(!mig.ok) return { ok:false, error:'migration_failed', message: mig.error };
        parsed = mig.state;
        // Re-save migrated state
        save(parsed);
      }

      var v = PPM.domain.validation.validateState(parsed);
      if(!v.valid) return { ok:false, error:'invalid', message: v.error };
      return { ok:true, state:parsed };
    } catch(e){
      return { ok:false, error:'parse', message: e.message };
    }
  }

  function clear(){
    try { localStorage.removeItem(KEY); return { ok:true }; }
    catch(e){ return { ok:false, error: e.message }; }
  }

  PPM.adapters.storage = Object.freeze({
    save:  save,
    load:  load,
    clear: clear,
    // Metadata for introspection (v2 will replace with real adapter info)
    _adapter: 'localStorage',
    _mvpOnly: true
  });
})();
