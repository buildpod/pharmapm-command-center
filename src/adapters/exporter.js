/* ============================================================================
   File: src/adapters/exporter.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.adapters.exporter
   Dependencies: PPM.domain.validation, PPM.domain.dates
   ============================================================================ */
(function(){
  function toJSON(state, exportedBy){
    var exp = JSON.parse(JSON.stringify(state));
    exp.exportDate = PPM.domain.dates.nowISO();
    exp.exportedBy = exportedBy || 'User';
    return exp;
  }

  function fromJSON(text){
    try {
      var parsed = JSON.parse(text);
      // Migrate if needed
      if(parsed.schemaVersion && parsed.schemaVersion !== PPM.schema.CURRENT_VERSION){
        var mig = PPM.migrations.migrate(parsed);
        if(!mig.ok) return { ok:false, error: mig.error };
        parsed = mig.state;
      }
      var v = PPM.domain.validation.validateState(parsed);
      if(!v.valid) return { ok:false, error: v.error };
      return { ok:true, state: parsed };
    } catch(e){
      return { ok:false, error:'Parse error: ' + e.message };
    }
  }

  function toCSV(rows, columns){
    if(!rows.length) return '';
    var header = columns.map(function(c){ return c.label; }).join(',');
    var body = rows.map(function(row){
      return columns.map(function(c){
        var v = row[c.key];
        return '"' + (v == null ? '' : String(v).replace(/"/g, '""')) + '"';
      }).join(',');
    }).join('\n');
    return header + '\n' + body;
  }

  function downloadBlob(content, filename, mimeType){
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  PPM.adapters.exporter = Object.freeze({
    toJSON:       toJSON,
    fromJSON:     fromJSON,
    toCSV:        toCSV,
    downloadBlob: downloadBlob
  });
})();
