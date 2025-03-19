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
import fs from 'fs'
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
        let ticketDetails;
        let cusRes = await getCustomerDataByContractId(admin, contractId);
        // if (payload?.billing_policy?.interval === "day") {
        //   billing_policy = { ...billing_policy, interval: "oneTime" };

        //   const mutationQuery = `#graphql
        //     mutation subscriptionContractCancel($subscriptionContractId: ID!) {
        //         subscriptionContractCancel(subscriptionContractId: $subscriptionContractId) {
        //             contract {
        //                     id
        //                     status
        //                 }
        //                 userErrors {
        //                     field
        //                     message
        //                 }
        //             }
        //         }`;
        //   const variables = {
        //     subscriptionContractId: payload?.admin_graphql_api_id,
        //   };

        //   const response = await admin.graphql(mutationQuery, { variables });

        //   const result = await response.json();
        // }
        let products = [];
        let planName = cusRes?.data?.lines?.edges[0]?.node?.sellingPlanName;
        let planId = cusRes?.data?.lines?.edges[0]?.node?.sellingPlanId;

        cusRes?.data?.lines?.edges?.map((product) => {
          let detail = {
            productId: product?.node?.productId,
            productName: product?.node?.title,
            quantity: product?.node?.quantity,
            sellingPlanName: product?.node?.sellingPlanName,
            sellingPlanId: product?.node?.sellingPlanId,
          };
          products.push(detail);
        });
        console.log("products===============", products);
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

        if (
          planName?.toLowerCase()?.includes("bronze-entries-") ||
          planName?.toLowerCase()?.includes("silver-entries-") ||
          planName?.toLowerCase()?.includes("gold-entries-") ||
          planName?.toLowerCase()?.includes("platinum-entries-")
        ) {
          let membership = await membershipsModel.create({
            shop: shop,
            customerId: customerId,
            orderId: orderId || "",
            contractId: contractId || "",
            membershipLevel: planName?.split("-")[0]?.toLowerCase() || "",
            membershipType:
              payload?.billing_policy?.interval == "day" ? "ONETIME" : "ACTIVE",
            sellingPlanName: planName,
            sellingPlanId: planId,
          });
          ticketDetails = {
            total: Number(drawIds?.length),
            totalTicketsList: drawIds,
            applied: 0,
            appliedTicketsList: [],
            available: Number(drawIds?.length),
            availableTicketsList: drawIds,
            appliedForDetail: [],
          };
        } else {
          ticketDetails = {
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
          };
        }
        // console.log("ticketDetails==", ticketDetails);
        let contractDetail = await subscriptionContractModel.create({
          shop: shop,
          orderId: orderId || "",
          contractId: contractId || "",
          customerName:
            `${cusRes?.data?.customer?.firstName || ""} ${cusRes?.data?.customer?.lastName || ""}`.trim(),
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
          products: products[0],
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
          products: products[0],
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
    case "ORDERS_CREATE":
      try {
        console.log(
          "details from ORDERS_CREATE",
          payload?.line_items[0]?.properties,
        );
        console.log(
          // payload?.line_items,
          "payload?.line_items===",
          payload?.line_items?.length,
        );
        const dataString = typeof payload?.line_items === "string" ? payload?.line_items : JSON.stringify(payload?.line_items);
         fs.writeFile("checkkkk.txt", dataString, (err) => {
      if (err) {
        console.error("Error writing to file:", err);
      } else {
        console.log("Data written to file successfully!");
      }
    });

        let entries;

        for (const product of payload?.line_items || []) {
          let oneTimeProductExist = product?.properties?.find(
            (property) =>
              property?.name == "plan-type" && property?.value == "onetime",
          );

          console.log("oneTimeProductExist", oneTimeProductExist);

          if (oneTimeProductExist) {
            entries = product?.properties?.find(
              (property) => property?.name == "entries",
            )?.value;
            console.log("entries==", entries);
            let drawIds = [];
            for (let i = 0; i < Number(entries); i++) {
              let unique = (
                Date.now().toString(36).substring(0, 4) +
                Math.random().toString(36).substring(2, 5)
              )
                .toUpperCase()
                .substring(0, 7);
              drawIds.push(unique);
            }
            let ticketDetails = {
              total: Number(drawIds?.length),
              totalTicketsList: drawIds,
              applied: Number(drawIds?.length),
              appliedTicketsList: drawIds,
              available: 0,
              availableTicketsList: [],
              appliedForDetail: [
                {
                  tickets: Number(drawIds?.length),
                  productId: `gid://shopify/Product/${product?.product_id}`,
                  productName: product.title,
                  appliedDate: new Date(),
                  appliedList: drawIds,
                },
              ],
            };

            let contractDetail = await subscriptionContractModel.create({
              shop: shop,
              orderId: payload?.id,
              contractId: "",
              customerName: `${payload?.customer?.first_name || ""} ${
                payload?.customer?.last_name || ""
              }`.trim(),
              customerEmail: payload?.customer?.email,
              customerId: payload?.customer?.id || "",
              // sellingPlanName: "",
              // sellingPlanId: "",
              planUpdateDetail: {
                sellingPlanUpdate: false,
                upgradeTo: "",
                futureEntries: 0,
              },
              billing_policy: {
                interval: "onetime",
                interval_count: 1,
                min_cycles: 1,
              },
              products: [
                {
                  productId: `gid://shopify/Product/${product?.product_id}`,
                  productName: product.title,
                  price: product?.price,
                  currency: product?.price_set?.shop_money?.currency_code,
                  quantity: 1,
                  entries: entries
                },
              ],
              drawIds: drawIds,
              status: "ONETIME",
              nextBillingDate: new Date().toISOString(),
              ticketDetails: ticketDetails,
            });

            const currentDate = new Date().toISOString();
            let billing = await billingModel.create({
              shop: shop,
              orderId: payload?.id,
              contractId: "",
              customerName: `${payload?.customer?.first_name || ""} ${
                payload?.customer?.last_name || ""
              }`.trim(),
              customerEmail: payload?.customer?.email,
              customerId: payload?.customer?.id || "",
              products: [
                {
                  productId: `gid://shopify/Product/${product?.product_id}`,
                  productName: product.title,
                  price: product?.price,
                  currency: product?.price_set?.shop_money?.currency_code,
                  quantity: 1,
                  entries: entries
                },
              ],
              billing_policy: {
                interval: "onetime",
                interval_count: 1,
                min_cycles: 1,
              },
              entries: entries,
              planUpdateDetail: {
                sellingPlanUpdate: false,
                upgradeTo: "",
                futureEntries: 0,
              },
              drawIds: drawIds,
              status: "done",
              billing_attempt_date: currentDate,
              renewal_date: currentDate,
              applied: false,
            });

            sendOrderEmail(contractDetail);
          }
        }

        return new Response("Order created successfully", { status: 200 });
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
