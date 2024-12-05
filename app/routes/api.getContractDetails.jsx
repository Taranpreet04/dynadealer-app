import { credentialModel } from "../schema";


export const action = async ({ request }) => {
  try {
    const data = await request.json();
    const shop = data?.shop;
    const contractId = data?.contractId;

    const res = await credentialModel.findOne({ shop: shop })
    const accessToken = res?.accessToken
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
                  totalPriceSet {
                    presentmentMoney {
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
      }
    );

    if (!fetchDetail.ok) {
      throw new Error(`Admin API request failed with status ${fetchDetail.status}`);
    }

    const responseJSON = await fetchDetail.json();

    return new Response(JSON.stringify({ message: "success", data: responseJSON.data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error processing POST request:", error);
    return new Response(JSON.stringify({ message: "Error processing request" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
