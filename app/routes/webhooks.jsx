import { sendEmail } from "../controllers/mail";
import { getCustomerDataByContractId } from "../controllers/planController";
import { credentialModel, subscriptionContractModel, billingModel } from "../schema";
import { authenticate } from "../shopify.server";
import shopify from "../shopify.server";
import fs from "fs"

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);
  if (!admin) {
    return new Response("Unauthorised user!", { status: 401 });
  }
  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        const deleteCredential = credentialModel.deleteOne({ shop });
        // const deleteBilling = shopify_sessions.deleteOne({shop});
        await Promise.all([
          deleteCredential,
          // deleteBilling
        ]);

        const sessionId = session.id;
        let check = await shopify.sessionStorage.deleteSession(sessionId);
        if (check) {
          return new Response("App uninstalled successfully", { status: 200 });
        } else {
          return new Response("App uninstalled successfully", { status: 200 });
        }
      }
      break;

    case "SUBSCRIPTION_CONTRACTS_CREATE":
      try {
        console.log("details from webhook_____SUBSCRIPTION_CONTRACTS_CREATE")
        const contractId = payload?.id; // Contract ID
        const orderId = payload?.origin_order_id; // Order ID
        const customerId = payload?.customer_id;
        let billing_policy = payload?.billing_policy
        let cusRes = await getCustomerDataByContractId(admin, contractId)
        console.log("cusRes=", cusRes)
        if (payload?.billing_policy?.interval === 'day') {
          billing_policy = { ...billing_policy, interval: 'oneTime' }

          const mutationQuery = `#graphql
            mutation subscriptionContractCancel($subscriptionContractId: ID!) {
                subscriptionContractCancel(subscriptionContractId: $subscriptionContractId) {
                    contract {
                            id
                            status
                        }
                        userErrors {
                            field
                            message
                        }
                    }
                }`;
          const variables = {
            subscriptionContractId: payload?.admin_graphql_api_id,
          };

          const response = await admin.graphql(mutationQuery,
            { variables },
          );

          const result = await response.json();
        }
        let customer = cusRes?.data?.customer
        let products = [];
        let planName = ''
        let planId = ''
        cusRes?.data?.lines?.edges?.map((product) => {
          let detail = {
            productId: product?.node?.productId,
            productName: product?.node?.title,
            quantity: product?.node?.quantity,
          }
          planName = product?.node?.sellingPlanName
          planId = product?.node?.sellingPlanId
          products.push(detail)
        })
        const mailData = {
          shop: shop,
          orderId: orderId || "",
          contractId: contractId || "",
          customer: cusRes?.data?.customer,
          sellingPlanName: planName,
          sellingPlanId: planId,
          billing_policy: billing_policy,
          products: products,
          entries: planName.split('-entries-')[1],
          status: payload?.billing_policy?.interval == 'day' ? 'ONETIME' : "ACTIVE",
          nextBillingDate: cusRes?.data?.nextBillingDate
        }
        let drawIds = []
        for (let i = 0; i < Number(mailData?.entries); i++) {
          let unique = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
          drawIds.push(unique)
        }

        let contractDetail = await subscriptionContractModel.create({
          shop: shop,
          orderId: orderId || "",
          contractId: contractId || "",
          customerName: customer.firstName + ' ' + customer.lastName || '',
          customerId: customerId || "",
          sellingPlanName: planName,
          sellingPlanId: planId,
          billing_policy: billing_policy,
          products: products,
          drawIds: drawIds,
          status: payload?.billing_policy?.interval == 'day' ? 'ONETIME' : "ACTIVE",
          nextBillingDate: cusRes?.data?.nextBillingDate
        });

        const currentDate = new Date().toISOString();
        let biiling = await billingModel.create({
          shop: shop,
          orderId: orderId || "",
          contractId: contractId || "",
          customerName: customer.firstName + ' ' + customer.lastName || '',
          customerId: customerId || "",
          products: products,
          entries: planName.split('-entries-')[1],
          drawIds: drawIds,
          status: "done",
          billing_attempt_date: currentDate,
          renewal_date: currentDate,
        });

        sendEmail({ ...mailData, drawIds });
        return new Response("Contract created successfully", { status: 200 });
      } catch (err) {
        console.error("Error processing webhook:", err);
        return new Response("Error processing webhook", { status: 200 });
      }
    case "SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS":
      try {
        console.log("subscription_billing_attempts/success webhook works= payload")
        const contractId = payload?.subscription_contract_id;
        const uniqueId = payload?.idempotency_key;
        let data = await billingModel.findOneAndUpdate(
          {
            contractId: payload?.subscription_contract_id,
            idempotencyKey: payload?.idempotency_key
          },
          {
            $set: {
              status: "done",
            },
          }
        )
        return new Response("subscription_billing_attempts/success", { status: 200 });
      } catch (err) {
        console.error("Error processing webhook:", err);
        return new Response("Error processing webhook", { status: 200 });
      }

    case "SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE":
      try {
        console.log("subscription_billing_attempts/failure webhook works= payload", payload)
        let data = await billingModel.findOneAndUpdate(
          {
            contractId: payload?.subscription_contract_id,
            idempotencyKey: payload?.idempotency_key
          },
          {
            $set: {
              status: "fail",
            },
          }
        )
        return new Response("subscription_billing_attempts/failure", { status: 200 });
      } catch (err) {
        console.error("Error processing webhook:", err);
        return new Response("Error processing webhook", { status: 200 });
      }

    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":

    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
