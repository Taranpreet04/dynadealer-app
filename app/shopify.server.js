import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb"
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import dbConnect from "./db.server";
import { credentialModel } from "./schema";
import dotenv from 'dotenv';
import cron from 'node-cron';
import {recurringOrderCron }from './controllers/cron.js'
dotenv.config()


dbConnect();

let scheduledJobs = cron.getTasks();
scheduledJobs.forEach((job) => job.stop()); 

const cronTimeEvery1hr= '0 * * * *' //"0 * * * *"---1hrs
var task = cron.schedule(cronTimeEvery1hr, recurringOrderCron, {
  scheduled: false
});
task.start();

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October24,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new MongoDBSessionStorage("mongodb://localhost:27017/subscription"),
  distribution: AppDistribution.AppStore,
  restResources,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    SUBSCRIPTION_CONTRACTS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    //   CUSTOMERS_DATA_REQUEST: {
    //   deliveryMethod: DeliveryMethod.Http,
    //   callbackUrl: "/webhooks"
    // },

    // CUSTOMERS_REDACT: {
    //   deliveryMethod: DeliveryMethod.Http,
    //   callbackUrl: "/webhooks"
    // },

    // SHOP_REDACT: {
    //   deliveryMethod: DeliveryMethod.Http,
    //   callbackUrl: "/webhooks",
    // },

    //   // PRODUCTS_DELETE : {
    //   //   deliveryMethod : DeliveryMethod.Http,
    //   //   callbackUrl : "/webhooks",
    //   // },

    //   // PRODUCTS_UPDATE : {
    //   //   deliveryMethod: DeliveryMethod.Http,
    //   //   callbackUrl: "/webhooks",
    //   // },

    //   // COLLECTIONS_DELETE : {
    //   //   deliveryMethod: DeliveryMethod.Http,
    //   //   callbackUrl: "/webhooks",
    //   // },

    //   // COLLECTIONS_UPDATE : {
    //   //   deliveryMethod: DeliveryMethod.Http,
    //   //   callbackUrl: "/webhooks",
    //   // },
  },
  hooks: {
    afterAuth: async ({ session, admin }) => {
      try {
        shopify.registerWebhooks({ session });
        const { shop, accessToken, scope } = session;
          const credentials = credentialModel.create({
            shop,
            accessToken,
            // scope
          });
        //       // const storeData = merchantModel.create({
        //       //   shop,
        //       //   email : shopDetails.email,
        //       //   country_name : shopDetails.country_name,
        //       //   shop_owner : shopDetails.shop_owner,
        //       //   iana_timezone : shopDetails.iana_timezone,
        //       //   checkout_api_supported : shopDetails.checkout_api_supported,
        //       //   country : shopDetails.country,
        //       //   currency : shopDetails.currency,
        //       //   eligible_for_payments : shopDetails.eligible_for_payments,
        //       //   password_enabled : shopDetails.password_enabled,
        //       //   plan_name : shopDetails.plan_name,
        //       //   primary_locale : shopDetails.primary_locale,
        //       //   password : ''
        //       // });
        //       // const subscription = billingModel.create({
        //       //   shop,
        //       //   interval : "EVERY_30_DAYS",
        //       //   price : "0",
        //       //   plan : "FREE",
        //       //   charge_id: "",
        //       //   activated_on : new Date().toISOString().slice(0, 10),
        //       //   billing_on : "",
        //       // });
        await Promise.all([credentials]);
      } catch (error) {
        console.log("Error in Installing", error)
        throw error;
      }
    },
  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
    v3_lineItemBilling: true,
    unstable_newEmbeddedAuthStrategy: true,
    wip_optionalScopesApi: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});
export default shopify;
export const apiVersion = ApiVersion.October24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

