import { billingModel, planDetailsModel, subscriptionContractModel } from '../schema'
// import fs from "fs";

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
                            fixedValue: parseInt(item?.price),
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
                        minCycles: item?.mincycle ? parseInt(item?.mincycle) : 1,
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
        let deletedPlanId = result?.data?.sellingPlanGroupDelete?.deletedSellingPlanGroupId
        if (deletedPlanId) {
            const dbResult = await planDetailsModel.deleteOne({ _id: deletingID, shop: shop, plan_group_id: deletedPlanId });
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

        const variantsToDelete = dbvarientIds.filter((x) => !varientIds.includes(x));
        const varientsToAdd = varientIds.filter((x) => !dbvarientIds.includes(x));

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
                            fixedValue: parseInt(item?.price),
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
                        minCycles: item?.mincycle ? parseInt(item?.mincycle) : 1,
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
                            fixedValue: parseInt(item?.price),
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
                        minCycles: item?.mincycle ? parseInt(item?.mincycle) : 1,
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
        if (!['ACTIVE', 'PAUSED', 'FAILED'].includes(contractStatus?.toUpperCase())) {
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
            let res = await subscriptionContractModel.findOneAndUpdate({ contractId: data?.contractDbID },
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

export const getAllSubscriptions = async (admin, page, search) => {
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
            status: "done"
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

// const dataString = typeof resData === "string" ? resData : JSON.stringify(resData);
// fs.writeFile("checkkkk.txt", dataString, (err) => {
//     if (err) {
//         console.error("Error writing to file:", err);
//     } else {
//         console.log("Data written to file successfully!");
//     }
// });