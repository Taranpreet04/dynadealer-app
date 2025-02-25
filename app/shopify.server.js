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
import { recurringOrderCron } from './controllers/cron.js'
import { setDefaultTemplate } from "./controllers/planController.js";
dotenv.config()


dbConnect();

let scheduledJobs = cron.getTasks();
scheduledJobs.forEach((job) => job.stop());

const cronTimeEvery1hr = '*/10 * * * *' //"0 * * * *"---1hrs
var task = cron.schedule(cronTimeEvery1hr, recurringOrderCron, {
  scheduled: false
});
task.start();
console.log("process.env", process.env)
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
  },
  hooks: {
    afterAuth: async ({ session, admin }) => {
      console.log("✅ afterAuth hook is running...");
      // console.log("session==", session)
      // console.log("admin==", admin)
      try {
        const res = shopify.registerWebhooks({ session });
        console.log("res==", res)
        const { shop, accessToken, scope } = session;
        console.log("👉 Shop:", shop, "Token:", accessToken);
        // const credentials = credentialModel.create({
        //   shop,
        //   accessToken,
        // });
        const credentials = await credentialModel.findOneAndUpdate(
          { shop },
          { accessToken },
          { upsert: true, new: true }
        );
        await setDefaultTemplate(shop)
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

