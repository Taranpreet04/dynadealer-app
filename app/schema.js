import mongoose from 'mongoose';

const planDetailsSchema = new mongoose.Schema(
  {
    shop: String,
    name: String,
    plans: Object,
    products: Object,
    plan_group_id: String,
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

let subscriptionContract = new mongoose.Schema({
    shop: String,
    orderId: String,
    customerId: String,
    customerName: String,
    contractId: String,
    sellingPlanId: String,
    sellingPlanName: String,
    billing_policy: Object,
    products: Object,
    entries: String,
    status: String,
    nextBillingDate: Date,
  }, { 
    timestamps: true 
});
let billingSchema = new mongoose.Schema({
    shop: String,
    orderId: String,
    customerId: String,
    customerName: String,
    contractId: String,
    products: Object,
    entries: String,
    status: String,
    billing_attempt_date: Date,
    renewal_date: Date,
    billing_attempt_id: String,
    idempotencyKey: String,
    // nextBillingDate: Date,
  }, { 
    timestamps: true 
});

















// const merchantSchema = new mongoose.Schema(
//   {
//     shop : {type : String, required : true},
//     email : String,
//     country_name : String,
//     shop_owner : String,
//     iana_timezone : String,
//     checkout_api_supported : Boolean,
//     country : String,
//     currency : String,
//     eligible_for_payments : Boolean,
//     password_enabled : Boolean,
//     plan_name : String,
//     primary_locale : String,
//     password : String
//   },
//   {
//    timestamps : true
//   }  
// )

// const billingSchema = new mongoose.Schema(
//   {
//     shop : {type :  String, required : true},
//     interval : {type : String, required : true},
//     price : {type : String, required : true},
//     plan : {type : String, required : true},
//     charge_id: String,
//     activated_on : String,
//     billing_on : String,
//   },
//   {
//     timestamps : true
//   }
// );

planDetailsSchema.index({ shop: 1 });
credentialSchema.index({ shop: 1 });
subscriptionContract.index({shop : 1});
billingSchema.index({shop : 1});

const planDetailsModel = mongoose.models?.planDetails || mongoose.model("planDetails", planDetailsSchema);
const credentialModel = mongoose.models?.credential || mongoose.model("credential", credentialSchema);
const subscriptionContractModel = mongoose.models?.contractDetails || mongoose.model("contractDetails", subscriptionContract);
const billingModel = mongoose.models?.billingDetails || mongoose.model("billingDetails", billingSchema);
// let orderContractDetails = mongoose.model("contract_details_id", subscriptionContract);
// const merchantModel = mongoose.models?.merchantInfo || mongoose.model("merchantInfo", merchantSchema);
// export default orderContractDetails;
export { planDetailsModel, credentialModel, subscriptionContractModel, billingModel};