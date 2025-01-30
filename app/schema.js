import mongoose from 'mongoose';

const planDetailsSchema = new mongoose.Schema(
  {
    shop: String,
    name: String,
    plans: Object,
    products: Object,
    plan_group_id: String,
    offerValidity: Object
  },
  { timestamps: true }
);

// Credentials Schema

const credentialSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  accessToken: { type: String, required: true },
  // scope : String
}, {
  timestamps: true
})

const subscriptionContract = new mongoose.Schema({
  shop: String,
  orderId: String,
  customerId: String,
  customerName: String,
  customerEmail: String,
  contractId: String,
  sellingPlanId: String,
  sellingPlanName: String,
  billing_policy: Object,
  products: Object,
  entries: String,
  drawIds: Object,
  status: String,
  nextBillingDate: Date,
}, {
  timestamps: true
});


const billingSchema = new mongoose.Schema({
  shop: String,
  orderId: String,
  customerId: String,
  customerName: String,
  customerEmail: String,
  contractId: String,
  products: Object,
  billing_policy: Object,
  entries: String,
  drawIds: Object,
  status: String,
  applied: Boolean,
  billing_attempt_date: Date,
  renewal_date: Date,
  billing_attempt_id: String,
  idempotencyKey: String,
}, {
  timestamps: true
});

planDetailsSchema.index({ shop: 1 });
credentialSchema.index({ shop: 1 });
subscriptionContract.index({ shop: 1 });
billingSchema.index({ shop: 1 });

const planDetailsModel = mongoose.models?.planDetails || mongoose.model("planDetails", planDetailsSchema);
const credentialModel = mongoose.models?.credential || mongoose.model("credential", credentialSchema);
const subscriptionContractModel = mongoose.models?.contractDetails || mongoose.model("contractDetails", subscriptionContract);
const billingModel = mongoose.models?.billingDetails || mongoose.model("billingDetails", billingSchema);
export { planDetailsModel, credentialModel, subscriptionContractModel, billingModel };