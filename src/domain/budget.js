/* ============================================================================
   File: src/domain/budget.js
   Loaded as a classic <script> tag in dependency order from index.html.
   ============================================================================ */

/* ============================================================================
   MODULE: PPM.domain.budget
   Dependencies: PPM.config
   ============================================================================ */
(function(){
  function computeBurn(cost){
    if(!cost.hours || cost.hours === 0) return 0;
    return Math.round((cost.used / cost.hours) * 100);
  }
  function burnBand(burnPct){
    var cfg = PPM.config.rules.burn;
    if(burnPct > cfg.redPct) return 'Red';
    if(burnPct > cfg.amberPct) return 'Amber';
    return 'Green';
  }
  function computeSpent(cost){
    return (parseInt(cost.used) || 0) * (parseInt(cost.rate) || 0);
  }
  function totalContracted(costs){
    return costs.reduce(function(s, c){
      return s + (parseInt(c.hours) || 0) * (parseInt(c.rate) || 0);
    }, 0);
  }
  function totalSpent(costs){
    return costs.reduce(function(s, c){ return s + computeSpent(c); }, 0);
  }
  PPM.domain.budget = Object.freeze({
    computeBurn:     computeBurn,
    burnBand:        burnBand,
    computeSpent:    computeSpent,
    totalContracted: totalContracted,
    totalSpent:      totalSpent
  });
})();
