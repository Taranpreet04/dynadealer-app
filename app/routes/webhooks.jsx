import { sendOrderEmail } from "../db.mailcontroller";
import { getCustomerDataByContractId } from "../controllers/planController";
import {
  credentialModel,
  subscriptionContractModel,
  billingModel,
  membershipsModel,
  planDetailsModel,
} from "../schema";
import { authenticate } from "../shopify.server";
import shopify from "../shopify.server";

export const action = async ({ request }) => {
  const { topic, shop, session, admin, payload } =
    await authenticate.webhook(request);
  if (!admin) {
    return new Response("Unauthorised user!", { status: 401 });
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        const deleteCredential = credentialModel.deleteOne({ shop });

        await Promise.all([deleteCredential]);

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
        console.log(
          "details from webhook_____SUBSCRIPTION_CONTRACTS_CREATE",
          payload,
        );
        const contractId = payload?.id;
        const orderId = payload?.origin_order_id;
        const customerId = payload?.customer_id;
        let billing_policy = payload?.billing_policy;
        let  ticketDetails;
        let cusRes = await getCustomerDataByContractId(admin, contractId);
        if (payload?.billing_policy?.interval === "day") {
          billing_policy = { ...billing_policy, interval: "oneTime" };

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

          const response = await admin.graphql(mutationQuery, { variables });

          const result = await response.json();
        }
        let products = [];
        let planName = cusRes?.data?.lines?.edges[0]?.node?.sellingPlanName;
        let planId = cusRes?.data?.lines?.edges[0]?.node?.sellingPlanId;
        
     
        cusRes?.data?.lines?.edges?.map((product) => {
          let detail = {
            productId: product?.node?.productId,
            productName: product?.node?.title,
            quantity: product?.node?.quantity,
          };
          products.push(detail);
        });
        let drawIds = [];
        for (let i = 0; i < Number(planName.split("-entries-")[1]); i++) {
          // let unique = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
          let unique = (
            Date.now().toString(36).substring(0, 4) +
            Math.random().toString(36).substring(2, 5)
          )
            .toUpperCase()
            .substring(0, 7);
          drawIds.push(unique);
        }
        let planDetails = await planDetailsModel?.findOne({
          shop: shop,
          "plans.plan_id": planId,
        });

        if (planName?.toLowerCase()?.includes("bronze-entries-")|| planName?.toLowerCase()?.includes("silver-entries-")|| planName?.toLowerCase()?.includes("gold-entries-")||planName?.toLowerCase()?.includes("platinum-entries-")) {
          let membership = await membershipsModel.create({
            shop: shop,
            customerId: customerId,
            orderId: orderId || "",
            contractId: contractId || "",
            membershipLevel: planName?.split("-")[0]?.toLowerCase() || "",
            membershipType: payload?.billing_policy?.interval == "day" ? "ONETIME" : "ACTIVE",
            sellingPlanName: planName,
            sellingPlanId: planId,
          });
          ticketDetails= {
            total: Number(drawIds?.length),
            totalTicketsList: drawIds,
            applied:0,
            appliedTicketsList: [],
            available: Number(drawIds?.length),
            availableTicketsList: drawIds,
            appliedForDetail: [],
          }
        }
        else{
          ticketDetails= {
            total: Number(drawIds?.length),
            totalTicketsList: drawIds,
            applied: Number(drawIds?.length),
            appliedTicketsList: drawIds,
            available: 0,
            availableTicketsList: [],
            appliedForDetail: [
              {
                tickets: Number(drawIds?.length),
                productId: products[0]?.productId,
                productName: products[0]?.productName,
                appliedDate: new Date(),
                appliedList: drawIds,
              },
            ],
          }
        }
        console.log("ticketDetails==", ticketDetails)
        let contractDetail = await subscriptionContractModel.create({
          shop: shop,
          orderId: orderId || "",
          contractId: contractId || "",
          customerName: `${cusRes?.data?.customer?.firstName || ''} ${cusRes?.data?.customer?.lastName || ''}`.trim(),
          customerEmail: cusRes?.data?.customer.email,
          customerId: customerId || "",
          sellingPlanName: planName,
          sellingPlanId: planId,
          planUpdateDetail: {
            sellingPlanUpdate: planDetails?.sellingPlanUpdate,
            upgradeTo: planDetails?.upgradeTo,
            futureEntries: planDetails?.futureEntries,
          },
          billing_policy: billing_policy,
          products: products,
          drawIds: drawIds,
          status:
            payload?.billing_policy?.interval == "day" ? "ONETIME" : "ACTIVE",
          nextBillingDate:
            payload?.billing_policy?.interval == "day"
              ? new Date().toISOString()
              : cusRes?.data?.nextBillingDate,
          ticketDetails: ticketDetails,
        });

        const currentDate = new Date().toISOString();
        let biiling = await billingModel.create({
          shop: shop,
          orderId: orderId || "",
          contractId: contractId || "",
          customerName:
            cusRes?.data?.customer?.firstName +
            " " +
            cusRes?.data?.customer?.lastName,
          customerEmail: cusRes?.data?.customer.email,
          customerId: customerId || "",
          products: products,
          billing_policy: billing_policy,
          entries: planName.split("-entries-")[1],
          planUpdateDetail: {
            sellingPlanUpdate: planDetails?.sellingPlanUpdate,
            upgradeTo: planDetails?.upgradeTo,
            futureEntries: planDetails?.futureEntries,
          },
          drawIds: drawIds,
          status: "done",
          billing_attempt_date: currentDate,
          renewal_date: currentDate,
          applied: false,
        });

        sendOrderEmail(contractDetail);
        return new Response("Contract created successfully", { status: 200 });
      } catch (err) {
        console.error("Error processing webhook:", err);
        return new Response("Error processing webhook", { status: 200 });
      }
    case "SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS":
      try {
        console.log(
          "subscription_billing_attempts/success webhook works= payload",
          payload,
        );
        let data = await billingModel.findOneAndUpdate(
          {
            contractId: payload?.subscription_contract_id,
            idempotencyKey: payload?.idempotency_key,
          },
          {
            $set: {
              status: "done",
            },
          },
        );
        if (data) {
          sendOrderEmail(data);
        }
        return new Response("subscription_billing_attempts/success", {
          status: 200,
        });
      } catch (err) {
        console.error("Error processing webhook:", err);
        return new Response("Error processing webhook", { status: 200 });
      }

    case "SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE":
      try {
        console.log(
          "subscription_billing_attempts/failure webhook works= payload",
          payload,
        );
        let data = await billingModel.findOneAndUpdate(
          {
            contractId: payload?.subscription_contract_id,
            idempotencyKey: payload?.idempotency_key,
          },
          {
            $set: {
              status: "fail",
            },
          },
        );
        return new Response("subscription_billing_attempts/failure", {
          status: 200,
        });
      } catch (err) {
        console.error("Error processing webhook:", err);
        return new Response("Error processing webhook", { status: 200 });
      }
      case "ORDER_CREATE":
        try{
          console.log(
            "details from ORDER_CREATE",
            payload,
          );
        }catch(err){
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
