import { getCustomerDataByContractId } from "../controllers/planController";
import { credentialModel, subscriptionContractModel, billingModel } from "../schema";
import { authenticate } from "../shopify.server";
import shopify from "../shopify.server";
import fs from "fs"

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);
  // console.log("let check topic==", topic)
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
        console.log("check---", check)
        if (check) {
          console.log(`Session with ID ${sessionId} has been deleted`);
          return new Response("App uninstalled successfully", { status: 200 });
        } else {
          console.log(`Session can't deleted`);
          return new Response("App uninstalled successfully", { status: 200 });
        }
      }
      break;

    case "SUBSCRIPTION_CONTRACTS_CREATE":
      try {
        console.log("details from webhook_______________")
        const contractId = payload?.id; // Contract ID
        const orderId = payload?.origin_order_id; // Order ID
        const customerId = payload?.customer_id;
        let billing_policy = payload?.billing_policy
        let cusRes = await getCustomerDataByContractId(admin, contractId)
        console.log("res_____________cusRes", cusRes)

        if (payload?.billing_policy?.interval === 'year') {
          billing_policy = { ...billing_policy, interval: 'oneTime' }
          //cancel contract
          console.log("contract to be delete_________", payload?.admin_graphql_api_id)
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
          console.log("cancel===", result)
          const dataString = typeof response === "string" ? result : JSON.stringify(result);
          fs.writeFile("checkkkk.txt", dataString, (err) => {
            if (err) {
              console.error("Error checkwriting to file:", err);
            } else {
              console.log("Data written to file for cancel contract!");
            }
          });
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
          status: payload?.billing_policy?.interval == 'year' ? 'ONETIME' : "ACTIVE",
          nextBillingDate: cusRes?.data?.nextBillingDate
        });
        console.log("contractDetail---", contractDetail)
        const currentDate = new Date().toISOString();
        let biiling = await billingModel.create({
          shop: shop,
          orderId: orderId || "",
          contractId: contractId || "",
          customerName: customer.firstName + ' ' + customer.lastName || '',
          customerId: customerId || "",
          products: products,
          entries: planName.split('-entries-')[1],
          status: "done",
          billing_attempt_date: currentDate,
          renewal_date: currentDate,
        });
        console.log("biiling---", biiling)
        const dataString = typeof cusRes === "string" ? cusRes : JSON.stringify(cusRes);
        fs.writeFile("checkkkk.txt", dataString, (err) => {
          if (err) {
            console.error("Error writing to file:", err);
          } else {
            console.log("Data written to file successfully!");
          }
        });
        return new Response("Contract created successfully", { status: 200 });
      } catch (err) {
        console.error("Error processing webhook:", err);
        return new Response("Error processing webhook", { status: 200 });
      }
    case "SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS":
      try {
        console.log("subscription_billing_attempts/success webhook works= payload", payload)
        const contractId = payload?.subscription_contract_id;
        const uniqueId = payload?.idempotency_key;
        console.log(contractId, "-----", uniqueId)
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
        console.log("data==*****", data)
        return new Response("subscription_billing_attempts/success", { status: 200 });
      } catch (err) {
        console.error("Error processing webhook:", err);
        return new Response("Error processing webhook", { status: 200 });
      }

    case "SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE":
      try {
        console.log("subscription_billing_attempts/failure webhook works= payload", payload)
        const contractId = payload?.subscription_contract_id;
        const uniqueId = payload?.idempotency_key;
        console.log(contractId, "-----", uniqueId)
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
        console.log("data==***failure**", data)
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
