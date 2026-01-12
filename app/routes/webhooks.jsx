import { sendOrderEmail } from "../db.mailcontroller";
import {
  getCustomerDataByContractId,
  getLiveRaffle,
  getMultiplierData,
  getProductMultiplier,
} from "../controllers/planController";
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
    

    const contractId = payload?.id;
    const orderId = payload?.origin_order_id;
    const customerId = payload?.customer_id;
    const billing_policy = payload?.billing_policy;

    let ticketDetails;
    let products = [];

    // 🧠 Get full contract + customer details
    const cusRes = await getCustomerDataByContractId(admin, contractId);
    const addressLength = cusRes?.data?.customer?.addresses?.length || 0;
    const actualAddress =
      cusRes?.data?.customer?.addresses?.[addressLength - 1] || null;

    // 🧩 Extract plan info
    const planName = cusRes?.data?.lines?.edges?.[0]?.node?.sellingPlanName;
    const planId = cusRes?.data?.lines?.edges?.[0]?.node?.sellingPlanId;

    cusRes?.data?.lines?.edges?.forEach((product) => {
      products.push({
        productId: product?.node?.productId,
        productName: product?.node?.title,
        quantity: product?.node?.quantity,
        sellingPlanName: product?.node?.sellingPlanName,
        sellingPlanId: product?.node?.sellingPlanId,
      });
    });

    const productId = products?.[0]?.productId || null;

    // 🧮 Base entries from plan name
    let totalEntries = Number(planName?.split("-entries-")?.[1]) || 0;

    // 🔢 Apply multiplier if defined for product
    const multiplierData = await getMultiplierData(shop);
    if (multiplierData) {
      const multiplier = await getProductMultiplier(
        multiplierData.data,
        productId
      );
      totalEntries *= multiplier;
    }

    // 🟢 Fetch discount codes from origin order via GraphQL
    let discountCodes = [];
    try {
      if (payload?.admin_graphql_api_origin_order_id) {
        const orderGID = payload.admin_graphql_api_origin_order_id;

        const orderQuery = `
          query GetOrder($id: ID!) {
            order(id: $id) {
              id
              name
              discountApplications(first: 10) {
                edges {
                  node {
                    ... on DiscountCodeApplication {
                      code
                    }
                  }
                }
              }
            }
          }
        `;

        const orderResponse = await admin.graphql(orderQuery, {
          variables: { id: orderGID },
        });
        const orderData = await orderResponse.json();

        discountCodes =
          orderData?.data?.order?.discountApplications?.edges?.map(
            (e) => e?.node?.code
          ) || [];
      }
    } catch (err) {
      console.error("Failed to fetch origin order discount codes:", err);
    }

    // 🟣 Compute bonus entries from discount codes
    let bonusEntries = 0;
    discountCodes.forEach((code) => {
      code = code?.toUpperCase?.() || "";
      if (code.startsWith("BONUSENTRY-")) {
        const extra = Number(code.split("BONUSENTRY-")[1]) || 0;
        bonusEntries += extra;
      } else if (code.startsWith("BONUS-")) {
        const extra = Number(code.split("BONUS-")[1]) || 0;
        bonusEntries += extra;
      }
    });

    totalEntries += bonusEntries;

    // 🆔 Generate unique draw IDs
    const drawIds = Array.from({ length: totalEntries }, () => {
      return (
        Date.now().toString(36).substring(0, 4) +
        Math.random().toString(36).substring(2, 5)
      )
        .toUpperCase()
        .substring(0, 7);
    });

    // 🗂️ Get plan details
    const planDetails = await planDetailsModel?.findOne({
      shop: shop,
      "plans.plan_id": planId,
    });

    // 👑 Create membership if plan name matches tier pattern
    if (
      planName?.toLowerCase()?.includes("bronze-entries-") ||
      planName?.toLowerCase()?.includes("silver-entries-") ||
      planName?.toLowerCase()?.includes("gold-entries-") ||
      planName?.toLowerCase()?.includes("platinum-entries-")
    ) {
      await membershipsModel.create({
        shop,
        customerId,
        orderId: orderId || "",
        contractId: contractId || "",
        membershipLevel: planName?.split("-")[0]?.toLowerCase() || "",
        membershipType:
          billing_policy?.interval === "day"
            ? "ONETIME"
            : `${billing_policy?.interval}ly`,
        sellingPlanName: planName,
        sellingPlanId: planId,
      });
    }

    // 🎟️ Apply to live raffle (if active)
    const liveRaffle = await getLiveRaffle(shop);
  
    if (liveRaffle?.activeDraws?.length > 0) {
      ticketDetails = {
        total: totalEntries,
        totalTicketsList: drawIds,
        applied: totalEntries,
        appliedTicketsList: drawIds,
        available: 0,
        availableTicketsList: [],
        appliedForDetail: [
          {
            tickets: totalEntries,
            productId: liveRaffle?.activeDraws?.[0]?.id,
            productName: liveRaffle?.activeDraws?.[0]?.title,
            appliedDate: new Date(),
            appliedList: drawIds,
          },
        ],
      };
    } else {
      ticketDetails = {
        total: totalEntries,
        totalTicketsList: drawIds,
        applied: 0,
        appliedTicketsList: [],
        available: totalEntries,
        availableTicketsList: drawIds,
        appliedForDetail: [],
      };
    }

    // 🧾 Create contract record
    const contractDetail = await subscriptionContractModel.create({
      shop,
      orderId: orderId || "",
      orderHashId: cusRes?.data?.originOrder?.name || "",
      totalPrice: cusRes?.data?.originOrder?.totalPrice || 0,
      contractId: contractId || "",
      customerName:
        `${cusRes?.data?.customer?.firstName?.trim() || ""} ${
          cusRes?.data?.customer?.lastName?.trim() || ""
        }`.trim(),
      customerEmail: cusRes?.data?.customer?.email,
      customerPhone:
        cusRes?.data?.customer?.phone || actualAddress?.phone || null,
      customerId,
      sellingPlanName: planName,
      sellingPlanId: planId,
      planUpdateDetail: {
        sellingPlanUpdate: planDetails?.sellingPlanUpdate,
        upgradeTo: planDetails?.upgradeTo,
        futureEntries: planDetails?.futureEntries,
      },
      billing_policy,
      products,
      drawIds,
      status: "ACTIVE",
      nextBillingDate: cusRes?.data?.nextBillingDate,
      ticketDetails,
    });

    // 💰 Create billing record
    const currentDate = new Date().toISOString();
    await billingModel.create({
      shop,
      orderId: orderId || "",
      contractId: contractId || "",
      customerName:
        `${cusRes?.data?.customer?.firstName?.trim() || ""} ${
          cusRes?.data?.customer?.lastName?.trim() || ""
        }`.trim(),
      customerEmail: cusRes?.data?.customer?.email,
      customerId,
      products,
      billing_policy,
      entries: totalEntries,
      planUpdateDetail: {
        sellingPlanUpdate: planDetails?.sellingPlanUpdate,
        upgradeTo: planDetails?.upgradeTo,
        futureEntries: planDetails?.futureEntries,
      },
      drawIds,
      status: "done",
      billing_attempt_date: currentDate,
      renewal_date: currentDate,
      applied: false,
    });

    // ✉️ Send confirmation email
    sendOrderEmail(contractDetail);

    return new Response("Contract created successfully", { status: 200 });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response("Error processing webhook", { status: 200 });
  }


case "SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS":
  try {
    const contractId = payload?.subscription_contract_id;
    const idempotencyKey = payload?.idempotency_key;
    const shop = payload?.shop_domain; // make sure you have shop in payload or context

    console.log("Billing success payload:", payload);

    // 🟢 Get the existing billing entry if it exists
    let existingBilling = await billingModel.findOneAndUpdate(
      {
        contractId: contractId,
        idempotencyKey: idempotencyKey,
      },
      {
        $set: {
          status: "done",
        },
      },
      { new: true },
    );

    if (existingBilling) {
      sendOrderEmail(existingBilling);
      return new Response("subscription_billing_attempts/success", {
        status: 200,
      });
    }

    // 🟣 Otherwise — create a new billing record with bonus logic

    // ✅ Fetch subscription contract details
    const contractQuery = `
      query GetContract($id: ID!) {
        subscriptionContract(id: $id) {
          id
          status
          nextBillingDate
          originOrder {
            id
            name
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            discountApplications(first: 10) {
              edges {
                node {
                  ... on DiscountCodeApplication {
                    code
                  }
                }
              }
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  productId
                  sellingPlanId
                  sellingPlanName
                }
              }
            }
          }
          customer {
            id
            firstName
            lastName
            email
            phone
          }
          billingPolicy {
            interval
            intervalCount
          }
        }
      }
    `;

    const gqlRes = await admin.graphql(contractQuery, {
      variables: { id: `gid://shopify/SubscriptionContract/${contractId}` },
    });
    const gqlData = await gqlRes.json();

    const contract = gqlData?.data?.subscriptionContract;
    if (!contract) throw new Error("Contract not found in GraphQL");

    const originOrder = contract?.originOrder;
    const discountEdges = originOrder?.discountApplications?.edges || [];
    const discountCodes = discountEdges.map((e) => e.node?.code);

    // ✅ Calculate base + bonus entries
    let totalEntries = 0;
    const planName =
      originOrder?.lineItems?.edges?.[0]?.node?.sellingPlanName || "";
    totalEntries = Number(planName.split("-entries-")[1]) || 0;

    // 🟢 Bonus entry logic
    let bonusEntries = 0;
    discountCodes.forEach((code) => {
      code = code?.toUpperCase?.() || "";
      if (code.startsWith("BONUSENTRY-")) {
        const extra = Number(code.split("BONUSENTRY-")[1]) || 0;
        bonusEntries += extra;
      } else if (code.startsWith("BONUS-")) {
        const extra = Number(code.split("BONUS-")[1]) || 0;
        bonusEntries += extra;
      }
    });
    totalEntries += bonusEntries;

    // ✅ Generate draw IDs
    let drawIds = [];
    for (let i = 0; i < totalEntries; i++) {
      let unique = (
        Date.now().toString(36).substring(0, 4) +
        Math.random().toString(36).substring(2, 5)
      )
        .toUpperCase()
        .substring(0, 7);
      drawIds.push(unique);
    }

    // ✅ Create new billing record
    const customer = contract?.customer;
    const billing_policy = contract?.billingPolicy;
    const currentDate = new Date().toISOString();

    const newBilling = await billingModel.create({
      shop: shop,
      orderId: originOrder?.id?.split("/").pop() || "",
      contractId: contractId,
      idempotencyKey,
      customerName:
        `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim(),
      customerEmail: customer?.email || "",
      customerId: customer?.id?.split("/").pop() || "",
      products:
        originOrder?.lineItems?.edges?.map((edge) => ({
          productId: edge.node?.productId,
          productName: edge.node?.title,
          quantity: edge.node?.quantity,
          sellingPlanName: edge.node?.sellingPlanName,
          sellingPlanId: edge.node?.sellingPlanId,
        })) || [],
      billing_policy,
      entries: totalEntries,
      drawIds,
      status: "done",
      billing_attempt_date: currentDate,
      renewal_date: currentDate,
      applied: false,
    });

    // ✅ Update subscription contract record (optional)
    await subscriptionContractModel.updateOne(
      { contractId: contractId },
      { $push: { "ticketDetails.totalTicketsList": { $each: drawIds } } },
    );

    // ✅ Send email
    sendOrderEmail(newBilling);

    return new Response("subscription_billing_attempts/success", {
      status: 200,
    });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response("Error processing webhook", { status: 200 });
  }


    case "SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE":
      try {
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
      console.log("Inside", payload);

      try {
        let entries;

        // Get discount codes from the order
        const discountCodes = payload?.discount_codes || [];
        let bonusEntries = 0;

        // Parse bonus from discount codes
        discountCodes.forEach((dc) => {
          const code = dc?.code?.toUpperCase() || "";
          if (code.startsWith("BONUSENTRY-")) {
            const extra = Number(code.split("BONUSENTRY-")[1]) || 0;
            bonusEntries += extra;
          } else if (code.startsWith("BONUS-")) {
            const extra = Number(code.split("BONUS-")[1]) || 0;
            bonusEntries += extra;
          }
        });

        for (const product of payload?.line_items || []) {
          const oneTimeProductExist = product?.properties?.find(
            (property) =>
              property?.name === "plan-type" && property?.value === "onetime",
          );

          if (oneTimeProductExist) {
            entries =
              (product?.properties?.find((p) => p?.name === "entries")?.value ||
                0) * product?.quantity;

            // Add bonus entries from discount codes
            entries += bonusEntries;

            if (Number(entries) <= 0) continue;

            // Generate draw IDs
            const drawIds = Array.from({ length: entries }, () => {
              return (
                Date.now().toString(36).substring(0, 4) +
                Math.random().toString(36).substring(2, 5)
              )
                .toUpperCase()
                .substring(0, 7);
            });

            // Live raffle ticket application
            const liveRaffle = await getLiveRaffle(shop);
            let ticketDetails;
            if (liveRaffle?.activeDraws?.length > 0) {
              ticketDetails = {
                total: entries,
                totalTicketsList: drawIds,
                applied: entries,
                appliedTicketsList: drawIds,
                available: 0,
                availableTicketsList: [],
                appliedForDetail: liveRaffle.activeDraws.map((draw) => ({
                  tickets: entries,
                  productId: draw.id,
                  productName: draw.title,
                  appliedDate: new Date(),
                  appliedList: drawIds,
                })),
              };
            } else {
              ticketDetails = {
                total: entries,
                totalTicketsList: drawIds,
                applied: 0,
                appliedTicketsList: [],
                available: entries,
                availableTicketsList: drawIds,
                appliedForDetail: [],
              };
            }

            // Create contract
            const contractDetail = await subscriptionContractModel.create({
              shop,
              orderId: payload?.id,
              orderHashId: payload?.name,
              totalPrice: Number(payload?.total_price),
              contractId: "",
              customerName: `${payload?.customer?.first_name || ""} ${
                payload?.customer?.last_name || ""
              }`.trim(),
              customerEmail: payload?.customer?.email,
              customerPhone:
                payload?.customer?.phone ||
                payload?.customer?.default_address?.phone ||
                null,
              customerId: payload?.customer?.id || "",
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
                  quantity: product?.quantity,
                  entries: entries,
                },
              ],
              drawIds,
              status: "ONETIME",
              nextBillingDate: new Date().toISOString(),
              ticketDetails,
            });

            // Create billing
            const currentDate = new Date().toISOString();
            await billingModel.create({
              shop,
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
                  entries: entries,
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
              drawIds,
              status: "done",
              billing_attempt_date: currentDate,
              renewal_date: currentDate,
              applied: false,
            });

            // Membership
            const membershipLevel = product?.properties
              ?.find((p) => p?.name === "membership")
              ?.value?.toLowerCase();

            if (membershipLevel) {
              await membershipsModel.create({
                shop,
                customerId: payload?.customer?.id || "",
                orderId: payload?.id,
                contractId: "",
                membershipLevel: membershipLevel,
                membershipType: "ONETIME",
              });
            }

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
