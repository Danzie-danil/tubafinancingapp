;(function(){
  window.subscription = { active: true, tier: 'pro' };
  window.applySubscriptionGating = function(){};
  window.subscriptionActivate = function(){ window.subscription.active = true; window.subscription.tier = 'pro'; };
  window.subscriptionDeactivate = function(){ window.subscription.active = true; window.subscription.tier = 'pro'; };
})();
