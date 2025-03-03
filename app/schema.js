import mongoose from 'mongoose';

const planDetailsSchema = new mongoose.Schema(
  {
    shop: String,
    name: String,
    sellingPlanUpdate: Boolean,
    upgradeTo: String,
    futureEntries: Number,
    raffleType: String,
    spots: Number,
    plans: Object,
    showOnPortal: Boolean,
    products: Object,
    plan_group_id: String,
    offerValidity: Object
  },
  { timestamps: true }
);
const templateSchema = new mongoose.Schema(
  {
    shop: { type: String, required: true },
    orderTemplate: Object,
    appliedTemplate: Object,
    winningTemplate: Object,
    announcementTemplate: Object
  },
  { timestamps: true }
);

// Credentials Schema

const credentialSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  accessToken: { type: String, required: true },
}, {
  timestamps: true
})

const subscriptionContract = new mongoose.Schema({
  shop: String,
  orderId: String,
  contractId: String,
  customerId: String,
  customerName: String,
  customerEmail: String,
  planUpdateDetail: Object,
  sellingPlanId: String,
  sellingPlanName: String,
  billing_policy: Object,
  products: Object,
  entries: String,
  drawIds: Object,
  status: String,
  nextBillingDate: Date,
  ticketDetails: Object
}, {
  timestamps: true
});
const membershipSchema = new mongoose.Schema({
  shop: String,
  orderId: String,
  contractId: String,
  customerId: String,
  membershipLevel: String,
  sellingPlanId: String,
  sellingPlanName: String,
}, {
  timestamps: true
});
// const raffleProductSchema = new mongoose.Schema({
//   shop: String,
//   productId: String,
//   productname: String,
//   inventory: Number,
//   status: Boolean,
//   raffleType: String,
//   spots: Number
// }, {
//   timestamps: true
// });
// const raffleProductSchema = new mongoose.Schema({
//   shop: String,
//   products: Object
// }, {
//   timestamps: true
// });


const billingSchema = new mongoose.Schema({
  shop: String,
  orderId: String,
  customerId: String,
  customerName: String,
  customerEmail: String,
  contractId: String,
  planUpdateDetail: Object,
  products: Object,
  billing_policy: Object,
  entries: String,
  drawIds: Object,
  status: String,
  applied: Boolean,
  appliedFor: Object,
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
membershipSchema.index({ shop: 1 });
// raffleProductSchema.index({ shop: 1 });
billingSchema.index({ shop: 1 });

const planDetailsModel = mongoose.models?.planDetails || mongoose.model("planDetails", planDetailsSchema);
const credentialModel = mongoose.models?.credential || mongoose.model("credential", credentialSchema);
const templateModel = mongoose.models?.template || mongoose.model("template", templateSchema);
const subscriptionContractModel = mongoose.models?.contractDetails || mongoose.model("contractDetails", subscriptionContract);
const membershipsModel = mongoose.models?.memberships || mongoose.model("memberships", membershipSchema);
// const raffleProductsModel = mongoose.models?.raffleProducts || mongoose.model("raffleProducts", raffleProductSchema);
const billingModel = mongoose.models?.billingDetails || mongoose.model("billingDetails", billingSchema);
export { planDetailsModel, credentialModel, templateModel, subscriptionContractModel, membershipsModel, billingModel };