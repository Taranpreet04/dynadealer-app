import { billingModel, planDetailsModel, subscriptionContractModel, templateModel } from '../schema'
import fs from "fs";

export const checkProductSubscription = async (newPlanDetails, id) => {
    try {
        const check = await planDetailsModel.find({
            shop: newPlanDetails?.shop,
            products: { $in: newPlanDetails?.products },
        });
        console.log("check=", check)
        let idMatch = 0
        let notMatch = 0
        if (check && id != "create") {

            check.map((itm) => {
                if (itm._id.toString() === id.toString()) {
                    idMatch = idMatch + 1
                } else {
                    notMatch = notMatch + 1
                }
            })
            if (notMatch > 0) {
                return true;
            } else if (idMatch == 1) {
                return false;
            }
        }
        return false;
    } catch (err) {
        console.error("Error checking product subscription:", err);
        throw err;
    }
}
export const createPlan = async (admin, newPlanDetail) => {
    const { shop } = admin.rest.session;
    const newPlanDetails = {
        ...newPlanDetail,
        shop: shop
    };


    try {
        const date = newPlanDetails?.offerValidity
        const startIST = toIST(date.start);
        let endIST = toIST(date.end);
        endIST.setHours(23, 59, 59, 999);
        endIST = toIST(endIST);

        let dateRange = {
            start: startIST,
            end: endIST,
        };

        let allOptions = [];
        newPlanDetails?.plans?.map((item) => {
            let unique =
                Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
            allOptions?.push(
                item?.name
            );
        });
        const topOptions = allOptions.join(",");

        let sellPlan = []
        newPlanDetails?.plans?.map((item) => {
            let pricingPolicy = []
            if (item?.price) {
                pricingPolicy.push({
                    fixed: {
                        adjustmentType: "PRICE",
                        adjustmentValue: {
                            fixedValue: parseFloat(item?.price),
                        },
                    },
                });
            }

            let additionData = JSON.stringify({
                entries: item.entries,
                exclusiveDraw: item.exclusiveDraw
            })
            sellPlan.push({
                name: item.name,
                options: item.purchaseType + " " + item.mincycle + " " + item.name,
                position: 1,
                description: additionData,
                category: "SUBSCRIPTION",
                inventoryPolicy: {
                    reserve: "ON_FULFILLMENT",
                },
                billingPolicy: {
                    recurring: {
                        interval: item?.purchaseType?.toUpperCase(),
                        intervalCount: 1,
                        minCycles: item?.mincycle ? parseFloat(item?.mincycle) : 1,
                    },
                },
                deliveryPolicy: {
                    recurring: {
                        intent: "FULFILLMENT_BEGIN",
                        preAnchorBehavior: "ASAP",
                        interval: item?.purchaseType?.toUpperCase(),
                        intervalCount: 1
                    },
                },
                pricingPolicies: pricingPolicy,
            });
        })

        const allVariants = newPlanDetails?.products?.reduce((acc, product) => {
            return acc.concat(product.variants);
        }, []);
        let varientIds = [];
        allVariants.map((item) => {
            varientIds.push(item.id);
        });

        const response = await admin.graphql(
            `#graphql
                    mutation createSellingPlanGroup($input: SellingPlanGroupInput!, $resources: SellingPlanGroupResourceInput) {
                    sellingPlanGroupCreate(input: $input, resources: $resources) {
                    sellingPlanGroup {
                        id
                        sellingPlans(first: 10) {
                        edges {
                            node {
                                id
                                name
                            }
                        }
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }`,
            {
                variables: {
                    "input": {
                        "appId": "SubscriptionApp2k24",
                        "name": newPlanDetails?.name,
                        "description": JSON.stringify(dateRange),
                        "merchantCode": newPlanDetails?.name,
                        "options": [topOptions],
                        "sellingPlansToCreate": sellPlan
                    },
                    "resources": {
                        "productVariantIds": varientIds
                    }
                },
            },
        );

        const data = await response.json();
        if (data?.data?.sellingPlanGroupCreate?.userErrors.length < 1) {
            let planGroupId =
                data?.data?.sellingPlanGroupCreate?.sellingPlanGroup?.id;
            let planIds =
                data?.data?.sellingPlanGroupCreate?.sellingPlanGroup?.sellingPlans
                    .edges;
            let plansWids = []
            if (newPlanDetails?.plans && planIds) {
                newPlanDetails.plans.map((plan) => {
                    const matchedItem = planIds.find((item) => plan?.name === item?.node?.name);
                    if (matchedItem) {
                        plansWids.push({ ...plan, plan_id: matchedItem.node.id });
                    } else {
                        plansWids.push({ ...plan })
                    }
                });
            }
            let newData = { ...newPlanDetails, plans: plansWids, plan_group_id: planGroupId, offerValidity: dateRange }
            const planDetails = await planDetailsModel.create(newData);
            return { success: true, planDetails };
        }
    } catch (error) {
        console.error("Error creating plan details:", error);
        return { success: false, error: "Failed to create plan details." };
    }
};

export const getAllPlans = async (admin) => {
    try {
        const { shop } = admin.rest.session;
        const planDetails = await planDetailsModel.find({ shop });
        return { success: true, planDetails };
    } catch (error) {
        console.error("Error getting plan details:", error);
        return { success: false, error: "Failed to create plan details." };
    }
}


export const deletePlanById = async (admin, data) => {
    try {
        // console.log("data--", data)
        const { shop } = admin.rest.session;
        const deletingID = data?._id

        const planId = {
            id: data?.plan_group_id,
        };
        const response = await admin.graphql(
            `#graphql
                    mutation sellingPlanGroupDelete($id: ID!) {
                    sellingPlanGroupDelete(id: $id) {
                        deletedSellingPlanGroupId
                    userErrors {
                        field
                        message
                    }
                }
            }`,
            {
                variables: planId,
            },
        );

        const result = await response.json();
        // const dataString = typeof result === "string" ? result : JSON.stringify(result);
        // fs.writeFile("checkkkk.txt", dataString, (err) => {
        //     if (err) {
        //         console.error("Error writing to file:", err);
        //     } else {
        //         console.log("Data written to file successfully!");
        //     }
        // });
        let deletedPlanId = result?.data?.sellingPlanGroupDelete?.deletedSellingPlanGroupId
        // console.log("bdeletedPlanId--", deletedPlanId)
        if (deletedPlanId) {
            const dbResult = await planDetailsModel.deleteOne({ _id: deletingID, shop: shop, plan_group_id: deletedPlanId });
            console.log("dbResult==", dbResult)
            if (dbResult) {
                return { status: true, data: "Plan Deleted" };
            } else {
                return { status: false, data: "Error Deleting File" };
            }
        } else {
            return { status: false, data: "Error Deleting File..." };
        }
    } catch (err) {
        console.error(err);
        return { status: false, data: "Something went wrong!!!" };
    }
}

export const getPlanById = async (admin, id) => {
    try {
        const { shop } = admin.rest.session;
        const planId = id
        const data = await planDetailsModel.findOne({ _id: planId });
        return (
            data
                ? {
                    status: true,
                    response: data,
                }
                : { status: false, response: "Error Fetching data" }
        );
    } catch (err) {
        console.log(err, "err");
        return { status: false, response: "Something Went wrong" };
    }
}

export const updatePlanById = async (admin, ids, newPlanDetails, data) => {
    try {
        const { shop } = admin.rest.session;
        let dbproductlist = data?.dbProducts
        const date = newPlanDetails?.offerValidity
        const startIST = toIST(date.start);
        let endIST = toIST(date.end);
        endIST.setHours(23, 59, 59, 999);
        endIST = toIST(endIST);

        let dateRange = {
            start: startIST,
            end: endIST,
        };
        const allVariants = newPlanDetails?.products.reduce((acc, product) => {
            return acc.concat(product.variants);
        }, []);
        let varientIds = [];
        allVariants.map((item) => {
            varientIds.push(item.id);
        });

        const alldbvarients = dbproductlist.reduce((acc, product) => {
            return acc.concat(product.variants);
        }, []);
        let dbvarientIds = [];
        alldbvarients.map((item) => {
            dbvarientIds.push(item.id);
        });

        const variantsToDelete = dbvarientIds.filter((x) => !varientIds?.includes(x));
        const varientsToAdd = varientIds.filter((x) => !dbvarientIds?.includes(x));

        let allOptions = [];
        newPlanDetails?.plans?.map((item) => {
            let unique =
                Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
            allOptions?.push(
                item?.name
            );
        });
        const topOptions = allOptions.join(",");

        let plansToCreate = []
        data?.newPlans?.map((item) => {
            let pricingPolicy = []
            if (item?.price) {
                pricingPolicy.push({
                    fixed: {
                        adjustmentType: "PRICE",
                        adjustmentValue: {
                            fixedValue: parseFloat(item?.price),
                        },
                    },
                });
            }
            let additionData = JSON.stringify({
                entries: item.entries,
                exclusiveDraw: item.exclusiveDraw
            })
            plansToCreate?.push({
                name: item.name,
                options: item.purchaseType + " " + item.mincycle + " " + item.name,
                position: 1,
                description: additionData,
                category: "SUBSCRIPTION",
                inventoryPolicy: {
                    reserve: "ON_FULFILLMENT",
                },
                billingPolicy: {
                    recurring: {
                        interval: item?.purchaseType?.toUpperCase(),
                        intervalCount: 1,
                        minCycles: item?.mincycle ? parseFloat(item?.mincycle) : 1,
                    },
                },
                deliveryPolicy: {
                    recurring: {
                        intent: "FULFILLMENT_BEGIN",
                        preAnchorBehavior: "ASAP",
                        intervalCount: 1,
                        interval: item?.purchaseType?.toUpperCase(),
                    },
                },
                pricingPolicies: pricingPolicy,
            })
        })

        let plansToUpdate = []
        data?.updatePlans?.map((item) => {
            let pricingPolicy = []
            if (item?.price) {
                pricingPolicy.push({
                    fixed: {
                        adjustmentType: "PRICE",
                        adjustmentValue: {
                            fixedValue: parseFloat(item?.price),
                        },
                    },
                });
            }

            let additionData = JSON.stringify({
                entries: item.entries,
                exclusiveDraw: item.exclusiveDraw
            })
            plansToUpdate?.push({
                id: item?.plan_id,
                name: item.name,
                options: item.purchaseType + " " + item.mincycle + " " + item.name,
                position: 1,
                description: additionData,
                category: "SUBSCRIPTION",
                inventoryPolicy: {
                    reserve: "ON_FULFILLMENT",
                },
                billingPolicy: {
                    recurring: {
                        interval: item?.purchaseType?.toUpperCase(),
                        intervalCount: 1,
                        minCycles: item?.mincycle ? parseFloat(item?.mincycle) : 1,
                    },
                },
                deliveryPolicy: {
                    recurring: {
                        intent: "FULFILLMENT_BEGIN",
                        preAnchorBehavior: "ASAP",
                        intervalCount: 1,
                        interval: item?.purchaseType?.toUpperCase(),
                    },
                },
                pricingPolicies: pricingPolicy,
            })
        })
        let planToDelete = []
        data?.deletePlans?.map((item) => {
            planToDelete?.push(item?.plan_id.trim())
        })
        const response = await admin.graphql(
            `#graphql
          mutation sellingPlanGroupUpdate($id: ID!, $input: SellingPlanGroupInput!) {
            sellingPlanGroupUpdate(id: $id, input: $input) {
              sellingPlanGroup {
                id
                sellingPlans(first: 10) {
                  edges {
                    node {
                      id
                      name
                      billingPolicy{
              ... on SellingPlanRecurringBillingPolicy {
                interval
                maxCycles
              }
            }
                      metafields(first: 10) {
                        edges {
                          node {
                            id
                            namespace
                            key
                            value
                          }
                        }
                      }
                    }
                  }
                }
              }
              userErrors {
                field
                message
              }
            }
          }`,
            {
                variables: {
                    "id": ids?.plan_group_id,
                    "input": {
                        "appId": "SubscriptionApp2k24",
                        "name": newPlanDetails?.name,
                        "description": JSON.stringify(dateRange),
                        "merchantCode": newPlanDetails?.name,
                        "options": [topOptions],
                        "sellingPlansToUpdate": plansToUpdate,
                        "sellingPlansToDelete": planToDelete,
                        "sellingPlansToCreate": plansToCreate
                    },
                },
            },
        );

        const resData = await response.json();

        let planIds = resData?.data?.sellingPlanGroupUpdate?.sellingPlanGroup?.sellingPlans?.edges
        if (planIds) {

            let plansWids = []
            if (newPlanDetails?.plans && planIds) {
                newPlanDetails.plans.map((plan) => {
                    const matchedItem = planIds.find((item) => plan?.name === item?.node?.name);
                    if (matchedItem) {
                        plansWids.push({ ...plan, plan_id: matchedItem.node.id })
                    } else {
                        plansWids.push({ ...plan })
                    }
                });
            }
            let newData = { ...newPlanDetails, plans: plansWids, offerValidity: dateRange }
            if (variantsToDelete?.length > 0) {
                const delVariantresponse = await admin.graphql(
                    `#graphql
                        mutation sellingPlanGroupRemoveProductVariants($id: ID!, $productVariantIds: [ID!]!) {
                            sellingPlanGroupRemoveProductVariants(id: $id, productVariantIds: $productVariantIds) {
                            removedProductVariantIds
                            userErrors {
                                field
                                message
                            }
                        }
                    }`,
                    {
                        variables: {
                            "id": ids?.plan_group_id,
                            "productVariantIds": variantsToDelete
                        },
                    },
                );
                const delVariantRes = await delVariantresponse.json();
            }

            if (varientsToAdd?.length > 0) {
                const addVariantresponse = await admin.graphql(
                    `#graphql
                        mutation sellingPlanGroupAddProductVariants($id: ID!, $productVariantIds: [ID!]!) {
                            sellingPlanGroupAddProductVariants(id: $id, productVariantIds: $productVariantIds) {
                                sellingPlanGroup {
                                    id
                                }
                            userErrors {
                                field
                                message
                            }
                        }
                    }`,
                    {
                        variables: {
                            "id": ids?.plan_group_id,
                            "productVariantIds": varientsToAdd
                        },
                    },
                );

                const addVariantRes = await addVariantresponse.json();
            }
            const query = { _id: ids?.id };
            const update = {
                ...newData, shop: shop
            };

            const options = { upsert: true, new: true, useFindAndModify: false };
            const doc = await planDetailsModel.findOneAndUpdate(query, update, options);

            if (doc) {
                return {
                    success: true,
                    result: "Successfully update plan",
                };
            } else {
                return { success: false, error: "Failed to update plan details." };
            }

        } else {
            return { success: false, error: "Failed to update plan details." };
        }

    } catch (error) {
        console.error("Error:", error);
        return { success: false, error: "Failed to update plan details." };
    }
}

export const cancelContract = async (admin, data) => {
    try {
        const query = `{
              subscriptionContract(id: "${data?.id}") {
                id
                status
                nextBillingDate
                billingPolicy {
                  intervalCount
                  interval
                  maxCycles
                  minCycles
                }
              }
            }`;
        const contractResponse = await admin.graphql(query);
        const contractResult = await contractResponse.json();
        if (contractResult?.data?.subscriptionContract?.userErrors?.length > 0) {
            return {
                message: "error",
                data: contractResult.data.subscriptionContract.userErrors[0].message,
                status: 400
            }
        }
        const contractStatus = contractResult?.data?.subscriptionContract?.status;
        if (!['ACTIVE', 'PAUSED', 'FAILED']?.includes(contractStatus?.toUpperCase())) {
            return {
                success: false,
                message: `Cannot cancel contract with status: ${contractStatus}`,
                status: 400,
            };
        }



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
            subscriptionContractId: data?.id,
        };

        const response = await admin.graphql(mutationQuery,
            { variables },
        );

        const result = await response.json();


        if (result.data?.subscriptionContractCancel?.userErrors?.length > 0) {
            return {
                success: false,
                message: result.data.subscriptionContractCancel.userErrors[0].message,
                status: 400
            }
        } else {
            console.log("data==", data)
            let res = await subscriptionContractModel.findOneAndUpdate({ _id: data?.contractDbID },
                { $set: { status: "CANCELLED" } },
                { new: true }
            )
            return {
                success: true,
                result: "Successfully cancel plan.",
                data: result.data.subscriptionContractCancel,
                res: res
            };
        }
    } catch (error) {
        console.error("Error:ad", error);
        return { success: false, error: "Failed to cancel plan." };
    }
}

export const getSubscriptions = async (admin, page, search) => {
    try {
        const { shop } = admin.rest.session;
        let skip = 0;
        page > 1 ? skip = (page - 1) * 10 : skip = 0;
        let total_data = 0
        let details = []
        if (search == '') {
            details = await subscriptionContractModel.find({ shop }).skip(skip).limit(10)
            total_data = await subscriptionContractModel.find({ shop }).countDocuments();
        } else {
            details = await subscriptionContractModel.find({
                shop: shop,
                customerName: { $regex: search, $options: "i" },
            }).skip(skip).limit(10)
            total_data = await subscriptionContractModel.find({
                shop: shop,
                customerName: { $regex: search, $options: "i" },
            }).countDocuments();
        }
        return { message: "success", details: details, status: 200, total: total_data };
    } catch (error) {
        console.error("Error processing POST request:", error);
        return { message: "Error processing request", status: 500 };
    }
}

export const getConstractDetailById = async (admin, id) => {
    const query = `
            query {
              subscriptionContract(id: "gid://shopify/SubscriptionContract/${id}") {
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
          `;
    const contractResponse = await admin.graphql(query);
    const contractResult = await contractResponse.json();
    if (contractResult?.data?.subscriptionContract?.userErrors?.length > 0) {
        return {
            message: "error",
            data: contractResult.data.subscriptionContract.userErrors[0].message,
            status: 400
        }
    }
    return {
        message: "success",
        data: contractResult.data.subscriptionContract,
        status: 200
    }
}
export const getCustomerDataByContractId = async (admin, id) => {
    const query = `{
          subscriptionContract(id: "gid://shopify/SubscriptionContract/${id}") {
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
            }`;
    const contractResponse = await admin.graphql(query);
    const contractResult = await contractResponse.json();
    if (contractResult?.data?.subscriptionContract?.userErrors?.length > 0) {
        return {
            message: "error",
            data: contractResult.data.subscriptionContract.userErrors[0].message,
            status: 400
        }
    }
    return {
        message: "success",
        data: contractResult.data.subscriptionContract,
        status: 200
    }
}

export const getExportData = async (admin, data, date) => {
    try {
        const startIST = toIST(date.start);
        let endIST = toIST(date.end);
        endIST.setHours(23, 59, 59, 999);
        endIST = toIST(endIST);

        let dateRange = {
            $gte: startIST,
            $lte: endIST,
        };
        const matchingDocuments = await billingModel.find({
            "products.productId": { $in: data },
            createdAt: dateRange,
            status: "done",
            applied: true
        })
        return { success: true, data: matchingDocuments };
    } catch (error) {
        console.error("Error processing POST request:", error);
        return { message: "Error processing request", status: 500 };
    }
}

const toIST = (dateString) => {
    const date = new Date(dateString);
    const offsetInMinutes = 330;
    return new Date(date.getTime() + offsetInMinutes * 60 * 1000);
};

export const checkMincycleComplete = async (contractId) => {
    try {
        let data = await billingModel.find({ contractId: contractId, status: "done" })
        return { message: "success", data }
    } catch (error) {
        console.error("Error processing POST request:", error);
        return { message: "Error processing request", status: 500 };
    }
}
export const getAllContracts = async (admin) => {
    try {
        const { shop } = admin.rest.session;
        const details = await subscriptionContractModel.find({ shop })
        return { message: "success", details: details, status: 200 };
    } catch (error) {
        console.error("Error processing POST request:", error);
        return { message: "Error processing request", status: 500 };
    }
}

// const dataString = typeof resData === "string" ? resData : JSON.stringify(resData);
// fs.writeFile("checkkkk.txt", dataString, (err) => {
//     if (err) {
//         console.error("Error writing to file:", err);
//     } else {
//         console.log("Data written to file successfully!");
//     }
// });

export const setDefaultTemplate = async (shop) => {
    try {
        // console.log("email template set", shop)
        let orderTemplate = {
            subject: "Your order is successfully done",
            from: "Membership App",
            html: `p>Hi {{customerName}},</p>
            <p>Thankyou to order for <b>{{productName}}</b> which is your${' '}
            <b>{{interval}}</b> plan.</p>
            <p>Your have {{drawIdsLength}} chances for winning.</p>
            <p>Your Entry Numbers are:</p>
            <table>
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Entry Number</th>
                    </tr>
                </thead>
                <tbody>
                    {{drawIdsList}}
                </tbody>
            </table>
            <p>Note: You must apply for tickets through the customer portal; otherwise, they will not be included in the lucky draw listing.</p>
               <p>Steps to apply for tickets-</p>
               <li>First Login to your customer portal.</li>
               <li>Then click on Mange Memberships box.</li>
               <li>Now you will able to see your orders list.</li>
               <li>Each order has a view icon that you need to click on it and apply your tickets to getting chances for lucky draws</li>
               `,
            dummyData: {
                "shop": "virendertesting.myshopify.com",
                "orderId": "6486463742142",
                "customerId": "7979103453374",
                "customerName": "Taran preet",
                "customerEmail": "taranpreet@shinedezign.com",
                "contractId": "24182882494",
                "sellingPlanId": "gid://shopify/SellingPlan/7428407486",
                "sellingPlanName": "New plan22-entries-7",
                "billing_policy": {
                    "interval": "month",
                    "interval_count": 1,
                    "min_cycles": 1,
                    "max_cycles": null
                },
                "products": [
                    {
                        "productId": "gid://shopify/Product/7837187014846",
                        "productName": "Antique Drawers",
                        "quantity": 1
                    }
                ],
                "drawIds": [
                    "M6LQWQG",
                    "M6LQCEC",
                ],
            },
            orderMailParameters: [
                {
                    term: '{{ customerName }}',
                    description:
                        `This specifies the customer's name.`,
                },
                {
                    term: '{{ productName }}',
                    description:
                        'This specifies the name of the product for which the order is placed.',
                },
                {
                    term: '{{ billingInterval }}',
                    description:
                        'It Shows the billing interval of subscription.',
                },
                {
                    term: '{{ drawsLength }}',
                    description:
                        'It denotes the total number of entries (chances to win).',
                },
                {
                    term: '{{ drawIdsList }}',
                    description:
                        'This is list of the tickets.',
                },
            ]
        }
        let appliedTemplate = {
            subject: "Your tickets are applied succesfully.",
            from: "Membership App",
            html: `
            <p>Hi {{customerName}},</p>

            <p>Your orderId is: {{orderId}}</p>
            <p>Your contractId is: {{contractId}}</p>
            <p>Your have {{drawIdsLength}} chances for winning.</p>
            <p>Here, the list of your ticket Entries which are applied for upcomming lucky draw.</p>
            <table>
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Entry Number</th>
                    </tr>
                </thead>
                <tbody>
                {{drawIdsList}}
                </tbody>
            </table>`,
            dummyData: {
                "shop": "virendertesting.myshopify.com",
                "orderId": "6486463742142",
                "customerId": "7979103453374",
                "customerName": "Taran preet",
                "customerEmail": "taranpreet@shinedezign.com",
                "contractId": "24182882494",
                "sellingPlanId": "gid://shopify/SellingPlan/7428407486",
                "sellingPlanName": "New plan22-entries-7",
                "billing_policy": {
                    "interval": "month",
                    "interval_count": 1,
                    "min_cycles": 1,
                    "max_cycles": null
                },
                "products": [
                    {
                        "productId": "gid://shopify/Product/7837187014846",
                        "productName": "Antique Drawers",
                        "quantity": 1
                    }
                ],
                "drawIds": [
                    "M6LQWQG",
                    "M6LQCEC",
                ],
            },
            appliedMailParameters: [
                {
                    term: '{{customerName}}',
                    description:
                        `This specifies the customer's name.`,
                },
                {
                    term: '{{productName}}',
                    description:
                        'This specifies the name of the product for which the order is placed.',
                },
                {
                    term: '{{interval}}',
                    description:
                        'It Shows the billing interval of subscription.',
                },
                {
                    term: '{{appliedLength}}',
                    description:
                        'It denotes the total number of entries (chances to win).',
                },
                {
                    term: '{{appliedList}}',
                    description:
                        'This is list of the tickets.',
                },
            ]
        }
        let winningTemplate = {
            subject: "Congratulations, YOU ARE A WINNER!",
            from: "Membership App",
            html: `<p>Hi {{customerName}},</p>
            <h4>Congratulations,</h4>
            
            <p>We are thrilled to inform you that <b>YOU ARE A WINNER!</b> </p>
            
            <p>As part of our exclusive <b>{{interval}}</b>plan, you have won a beautiful <b>{{productName}}</b>
            timeless piece that adds charm and elegance to any space.</p> 
            <p>Thank you for being a valued part of our community. We appreciate your participation and look forward to more exciting moments with you!

                    If you have any questions, feel free to reach out.
  </p>
           <pre> 
        Best regards,
        [Your Name]
        [Your Company Name]
        [Your Contact Information]
            </pre>
          
         `,
            dummyData: {
                "shop": "virendertesting.myshopify.com",
                "orderId": "6486463742142",
                "customerId": "7979103453374",
                "customerName": "Taran preet",
                "customerEmail": "taranpreet@shinedezign.com",
                "contractId": "24182882494",
                "sellingPlanId": "gid://shopify/SellingPlan/7428407486",
                "sellingPlanName": "New plan22-entries-7",
                "billing_policy": {
                    "interval": "month",
                    "interval_count": 1,
                    "min_cycles": 1,
                    "max_cycles": null
                },
                "products": [
                    {
                        "productId": "gid://shopify/Product/7837187014846",
                        "productName": "Antique Drawers",
                        "quantity": 1
                    }
                ],
                "drawIds": [
                    "M6LQWQG",
                    "M6LQCEC",
                ],
            },
            winnerMailParameters: [
                {
                    term: '{{customerName}}',
                    description:
                        `This specifies the customer's name.`,
                },
                {
                    term: '{{productName}}',
                    description:
                        'This specifies the name of the product for which the order is placed.',
                },
                {
                    term: '{{interval}}',
                    description:
                        'It Shows the billing interval of subscription.',
                },
                // {
                //     term: '{{ticket}}',
                //     description:
                //         'Winner Announcement',
                // },
            ]
        }
        const templateExist = await templateModel?.findOne({ shop })
        if (!templateExist) {
            const newTemplate = await templateModel.create(
                {
                    shop: shop,
                    orderTemplate: orderTemplate,
                    appliedTemplate: appliedTemplate,
                    winningTemplate: winningTemplate
                })
            return { message: "success", newTemplate }
        } else {
            const newTemplate = await templateModel.findOneAndUpdate(
                { shop },
                {
                    $set: {
                        orderTemplate: orderTemplate,
                        appliedTemplate: appliedTemplate,
                        winningTemplate: winningTemplate
                    }
                },
                { upsert: true, new: true }
            )
            return { message: "success", newTemplate }
        }
    } catch (error) {
        console.error("Error processing POST request:", error);
        return { message: "Error processing request", status: 500 };
    }
}
export const getEmailTemplate = async (admin) => {
    try {
        const { shop } = admin.rest.session;
        console.log("email template get", shop)

        const data = await templateModel.findOne({ shop });
        // console.log("template==", data)
        return { message: "success", data }
    } catch (error) {
        console.error("Error processing POST request:", error);
        return { message: "Error processing request", status: 500 };
    }
}
export const updateTemplate = async (admin, data) => {
    try {
        const { shop } = admin.rest.session;
        // console.log("email template get", shop)

        const template = await templateModel.findOneAndUpdate(
            { shop },
            { $set: { ...data } },
            { upsert: true, new: true }
        );
        // console.log("template===", template)
        return { message: "success", template }
    } catch (error) {
        console.error("Error processing POST request:", error);
        return { message: "Error processing request", status: 500 };
    }
}