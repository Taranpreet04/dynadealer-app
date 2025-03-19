import { getSpecificContract } from "../controllers/planController";
import { credentialModel, subscriptionContractModel } from "../schema";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers,
    });
  }
};
export const action = async ({ request }) => {
  try {
    const data = await request.json();
    const shop = data?.shop;
    const contractId = data?.contractId;
    let id= contractId.split('SubscriptionContract/')[1]
    console.log("id==", id)
    if (id?.length > 15) {
      const details = await subscriptionContractModel.findOne({ shop , _id: id});
      console.log("details==", details)
      return new Response(
        JSON.stringify({ message: "success", data: details }),
        {
          status: 200,
          headers,
        },
      );
    } else {
      const res = await credentialModel.findOne({ shop: shop });
      const accessToken = res?.accessToken;
      const fetchDetail = await fetch(
        `https://${shop}/admin/api/2023-10/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({
            query: `
          query {
            subscriptionContract(id: "${contractId}") {
              id
              status
              originOrder {
                id
                name
                totalPrice
                totalPriceSet {
                  presentmentMoney {
                    amount
                    currencyCode
                  }
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                customerLocale
              }
              customer {
                firstName
                lastName
                id
                email
              }
              nextBillingDate
              billingPolicy {
                intervalCount
                interval
                maxCycles
                minCycles
              }
              deliveryPolicy {
                intervalCount
              }
              lines(first: 50) {
                edges {
                  node {
                    id
                    quantity
                    sellingPlanId
                    sellingPlanName
                    productId
                    requiresShipping
                    variantId
                    variantTitle
                    title
                    quantity
                    variantImage {
                      url
                    }
                    discountAllocations {
                      amount {
                        amount
                      }
                      discount {
                        __typename
                        ... on SubscriptionManualDiscount {
                          title
                        }
                      }
                    }
                    pricingPolicy {
                      basePrice {
                        amount
                      }
                      cycleDiscounts {
                        adjustmentType
                        afterCycle
                        computedPrice {
                          amount
                        }
                        adjustmentValue {
                          ... on MoneyV2 {
                            amount
                            currencyCode
                          }
                          ... on SellingPlanPricingPolicyPercentageValue {
                            percentage
                          }
                        }
                      }
                    }
                    currentPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        `,
          }),
        },
      );

      if (!fetchDetail.ok) {
        throw new Error(
          `Admin API request failed with status ${fetchDetail.status}`,
        );
      }

      const responseJSON = await fetchDetail.json();

      return new Response(
        JSON.stringify({ message: "success", data: responseJSON.data }),
        {
          status: 200,
          headers,
        },
      );
    }
  } catch (error) {
    console.error("Error processing POST request:", error);
    return json(
      { message: "Error processing request" },
      {
        status: 500,
        headers,
      },
    );
  }
};
