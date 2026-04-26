/* ============================================================================
   File: src/domain/risk.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.domain.risk
   Dependencies: PPM.config
   ============================================================================ */
(function(){
  function computeScore(risk){
    var p = parseInt(risk.prob) || 0;
    var i = parseInt(risk.impact) || 0;
    return p * i;
  }
  function scoreBand(score){
    var cfg = PPM.config.rules.risk;
    if(score >= cfg.highScore) return 'High';
    if(score >= cfg.mediumScore) return 'Medium';
    return 'Low';
  }
  function countCritical(risks){
    var cfg = PPM.config.rules.risk;
    return risks.filter(function(r){
      return computeScore(r) >= cfg.highScore && r.status !== 'Closed';
    }).length;
  }
  PPM.domain.risk = Object.freeze({
    computeScore:  computeScore,
    scoreBand:     scoreBand,
    countCritical: countCritical
  });
})();
