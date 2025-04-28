
var PlanFrequence = require('../Merchant/PlanFrequence');

function Plan() {
  this.Id = 0;
  this.PlanFrequence = PlanFrequence;
  this.Name = null;
  this.Description = null;
  this.Amount = null;
  this.SubscriptionLimit = null;
  this.DaysTrial = null;
  this.DaysToInactive = null;
  this.ChargeDay = null;
  this.SubscriptionTax = null;
  this.IsProRata = null;
  this.IsEnabled = null;
  this.IsImmediateCharge = null;
  this.CallbackUrl = null;
  this.ExpirationDate = null;
}

module.exports = Plan;