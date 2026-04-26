/* ============================================================================
   File: src/domain/validation.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.domain.validation
   Dependencies: PPM.schema, PPM.domain.dates, PPM.config
   ============================================================================ */
(function(){
  var dates = PPM.domain.dates;

  function validateState(state){
    if(!state || typeof state !== 'object') return { valid:false, error:'State is not an object' };
    if(!state.schemaVersion) return { valid:false, error:'Missing schemaVersion' };
    if(!state.meta || !state.meta.name) return { valid:false, error:'Missing meta.name' };
    if(!Array.isArray(state.milestones)) return { valid:false, error:'milestones is not an array' };
    if(!Array.isArray(state.tasks)) return { valid:false, error:'tasks is not an array' };
    if(!Array.isArray(state.risks)) return { valid:false, error:'risks is not an array' };
    if(!Array.isArray(state.documents)) return { valid:false, error:'documents is not an array' };
    if(!Array.isArray(state.costs)) return { valid:false, error:'costs is not an array' };
    return { valid:true };
  }

  function validateWizardStep1(w){
    if(!w.name) return { valid:false, error:'Project name is required' };
    if(!w.pm) return { valid:false, error:'Project manager is required' };
    if(!w.goLive) return { valid:false, error:'Go-Live date is required' };
    if(!dates.isValidISO(w.goLive)) return { valid:false, error:'Go-Live date must be valid ISO (YYYY-MM-DD)' };
    if(!w.system) return { valid:false, error:'System is required' };
    if(!w.methodology) return { valid:false, error:'Methodology is required' };
    return { valid:true };
  }

  // Validate a single field value against its schema definition
  function validateField(value, def){
    if(value == null || value === ''){
      if(def.required && !def.nullable) return { valid:false, error:'Required field missing' };
      return { valid:true };
    }
    var t = def.type;
    if(t === 'string'){
      if(typeof value !== 'string') return { valid:false, error:'Expected string' };
      if(def.maxLen && value.length > def.maxLen) return { valid:false, error:'Exceeds max length ' + def.maxLen };
    } else if(t === 'integer'){
      if(typeof value !== 'number' || !Number.isInteger(value)) return { valid:false, error:'Expected integer' };
      if(def.min != null && value < def.min) return { valid:false, error:'Below min ' + def.min };
      if(def.max != null && value > def.max) return { valid:false, error:'Above max ' + def.max };
    } else if(t === 'number'){
      if(typeof value !== 'number') return { valid:false, error:'Expected number' };
      if(def.min != null && value < def.min) return { valid:false, error:'Below min ' + def.min };
    } else if(t === 'boolean'){
      if(typeof value !== 'boolean') return { valid:false, error:'Expected boolean' };
    } else if(t === 'iso-date'){
      if(!dates.isValidISO(value)) return { valid:false, error:'Expected ISO date YYYY-MM-DD' };
    } else if(t && t.indexOf('enum:') === 0){
      var enumKey = t.substring(5);
      var allowed = PPM.config.rules.enums[enumKey];
      if(!allowed) return { valid:true }; // unknown enum, skip
      if(allowed.indexOf(value) < 0) return { valid:false, error:'Must be one of: ' + allowed.join(', ') };
    }
    return { valid:true };
  }

  PPM.domain.validation = Object.freeze({
    validateState:       validateState,
    validateWizardStep1: validateWizardStep1,
    validateField:       validateField
  });
})();
