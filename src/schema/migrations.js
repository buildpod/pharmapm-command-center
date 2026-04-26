/* ============================================================================
   File: src/schema/migrations.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.migrations
   Dependencies: PPM.schema
   Purpose: Forward-compatible migration hooks. v1 is current, no migration yet.
   When v2 schema ships, add a v1->v2 function here.
   ============================================================================ */
(function(){
  var migrations = {
    // Key: 'fromVersion->toVersion'
    // Value: function(oldState) -> newState
    //
    // Phase 1: 1.0 → 1.1 is a no-op identity migration.
    // No fields added, removed, or renamed. Only the version stamp changes.
    // This entry exists so that any state saved as 1.0 in earlier dev sessions
    // loads cleanly under the new version.
    '1.0->1.1': function(oldState){
      var migrated = Object.assign({}, oldState);
      migrated.schemaVersion = '1.1';
      // Defensive: ensure audit array exists (was already present in defaultState,
      // but old hand-edited states might lack it)
      if(!Array.isArray(migrated.audit)) migrated.audit = [];
      return migrated;
    }
  };

  function migrate(state){
    var v = state.schemaVersion;
    if(!v) return { ok:false, error:'Missing schemaVersion' };
    if(v === PPM.schema.CURRENT_VERSION) return { ok:true, state:state, migrated:false };

    // Attempt stepwise migration
    var current = state;
    var steps = 0;
    while(current.schemaVersion !== PPM.schema.CURRENT_VERSION){
      var key = current.schemaVersion + '->';
      var available = Object.keys(migrations).filter(function(k){ return k.indexOf(key) === 0; });
      if(available.length === 0){
        return { ok:false, error:'No migration path from v' + current.schemaVersion + ' to v' + PPM.schema.CURRENT_VERSION };
      }
      // Take the first available migration
      var migrationKey = available[0];
      current = migrations[migrationKey](current);
      steps++;
      if(steps > 20){ return { ok:false, error:'Migration loop detected' }; }
    }
    return { ok:true, state:current, migrated:true, steps:steps };
  }

  PPM.migrations = Object.freeze({
    migrate: migrate,
    _registered: function(){ return Object.keys(migrations); }
  });
})();
