import { cancelContractMail, sendOrderEmail } from "../db.mailcontroller";
import {
  billingModel,
  planDetailsModel,
  subscriptionContractModel,
  templateModel,
} from "../schema";
import fs from "fs";


export const checkProductSubscription = async (newPlanDetails, id) => {
  try {

    let check;

    if (id == "create") {
      check = await planDetailsModel.find({
        shop: newPlanDetails?.shop,
        products: {
          $elemMatch: {
            product_id: {
              $in: newPlanDetails?.products.map((p) => p.product_id),
            },
          },
        },
      });
    } else {
      check = await planDetailsModel.find({
        shop: newPlanDetails?.shop,
        _id: { $ne: id },
        products: {
          $elemMatch: {
            product_id: {
              $in: newPlanDetails?.products.map((p) => p.product_id),
            }, // Check if any product_id exists in products array
          },
        },
      });
    }

    return check?.length > 0 ? true : false;
  } catch (err) {
    console.error("Error checking product subscription:", err);
    throw err;
  }
};


export const createPlan = async (admin, newPlanDetail) => {
  const { shop } = admin.rest.session;
  const newPlanDetails = {
    ...newPlanDetail,
    shop: shop,
  };

  try {
    const date = newPlanDetails?.offerValidity;
    const startIST = toIST(date.start);
    let endIST = toIST(date.end);
    endIST.setHours(23, 59, 59, 999);
    // endIST = toIST(endIST);

    let dateRange = {
      start: startIST,
      end: endIST,
    };

    let storefrontDescription = {
      dateRange: dateRange,
      raffleType: newPlanDetail?.raffleType,
      spotsPerPerson: newPlanDetail?.spots,
    };

    let allOptions = [];
    newPlanDetails?.plans?.map((item) => {
      let unique =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      allOptions?.push(item?.name);
    });
    const topOptions = allOptions.join(",");

    let sellPlan = [];
    newPlanDetails?.plans?.map((item) => {
      let pricingPolicy = [];
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
        ...storefrontDescription,
        entries: item.entries,
      });
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
            intervalCount: 1,
          },
        },
        pricingPolicies: pricingPolicy,
      });
    });

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
          input: {
            appId: "SubscriptionApp2k24",
            name: newPlanDetails?.name,
            description: JSON.stringify(storefrontDescription),
            merchantCode: newPlanDetails?.name,
            options: [topOptions],
            sellingPlansToCreate: sellPlan,
          },
          resources: {
            productVariantIds: varientIds,
          },
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
      let plansWids = [];
      if (newPlanDetails?.plans && planIds) {
        newPlanDetails.plans.map((plan) => {
          const matchedItem = planIds.find(
            (item) => plan?.name === item?.node?.name,
          );
          if (matchedItem) {
            plansWids.push({ ...plan, plan_id: matchedItem.node.id });
          } else {
            plansWids.push({ ...plan });
          }
        });
      }
      let newData = {
        ...newPlanDetails,
        plans: plansWids,
        plan_group_id: planGroupId,
        offerValidity: dateRange,
      };
      const planDetails = await planDetailsModel.create(newData);
      return { success: true, planDetails };
    }
  } catch (error) {
    console.error("Error creating plan details:", error);
    return { success: false, error: "Failed to create plan details." };
  }
};

export const getAllPlans = async (admin, type = 'other') => {
  try {
    const { shop } = admin.rest.session;
    let planDetails = []
    if (type == "membership") {
      planDetails = await planDetailsModel.find({ shop: shop, raffleType: type }).sort({ createdAt: -1 });
    } else {
      planDetails = await planDetailsModel.find({
        shop: shop,
        raffleType: { $ne: "membership" }
      }).sort({ createdAt: -1 });

    }
    return { success: true, planDetails };
  } catch (error) {
    console.error("Error getting plan details:", error);
    return { success: false, error: "Failed to create plan details." };
  }
};

export const deletePlanById = async (admin, data) => {
  try {
    const { shop } = admin.rest.session;
    const deletingID = data?._id;

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
    
    let deletedPlanId =
      result?.data?.sellingPlanGroupDelete?.deletedSellingPlanGroupId;
    if (deletedPlanId) {
      const dbResult = await planDetailsModel.deleteOne({
        _id: deletingID,
        shop: shop,
        plan_group_id: deletedPlanId,
      });

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
};

export const getPlanById = async (admin, id) => {
  try {
    const { shop } = admin.rest.session;
    const planId = id;
    const data = await planDetailsModel.findOne({ _id: planId });
    return data
      ? {
        status: true,
        response: data,
      }
      : { status: false, response: "Error Fetching data" };
  } catch (err) {
    console.log(err, "err");
    return { status: false, response: "Something Went wrong" };
  }
};
export const updatePlanById = async (admin, ids, newPlanDetails, data) => {

  try {
    const { shop } = admin.rest.session;
    let dbproductlist = data?.dbProducts;
    const date = newPlanDetails?.offerValidity;
    const startIST = toIST(date.start);
    let endIST = toIST(date.end);
    endIST.setHours(23, 59, 59, 999);

    let dateRange = {
      start: startIST,
      end: endIST,
    };

    let storefrontDescription = {
      dateRange: dateRange,
      raffleType: newPlanDetails?.raffleType,
      spotsPerPerson: newPlanDetails?.spots,
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

    const variantsToDelete = dbvarientIds.filter(
      (x) => !varientIds?.includes(x),
    );
    const varientsToAdd = varientIds.filter((x) => !dbvarientIds?.includes(x));

    let allOptions = [];
    newPlanDetails?.plans?.map((item) => {
      let unique =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      allOptions?.push(item?.name);
    });
    const topOptions = allOptions.join(",");

    let plansToCreate = [];
    data?.newPlans?.map((item) => {
      let pricingPolicy = [];
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
        ...storefrontDescription,
        entries: item.entries,
      });
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
      });
    });

    let plansToUpdate = [];
    data?.updatePlans?.map((item) => {
      let pricingPolicy = [];
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
        ...storefrontDescription,
        entries: item.entries,
      });
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
      });
    });
    let planToDelete = [];
    data?.deletePlans?.map((item) => {
      planToDelete?.push(item?.plan_id.trim());
    });
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
          id: ids?.plan_group_id,
          input: {
            appId: "SubscriptionApp2k24",
            name: newPlanDetails?.name,
            description: JSON.stringify(storefrontDescription),
            merchantCode: newPlanDetails?.name,
            options: [topOptions],
            sellingPlansToUpdate: plansToUpdate,
            sellingPlansToDelete: planToDelete,
            sellingPlansToCreate: plansToCreate,
          },
        },
      },
    );

    const resData = await response.json();

    let planIds =
      resData?.data?.sellingPlanGroupUpdate?.sellingPlanGroup?.sellingPlans
        ?.edges;
    if (planIds) {
      let plansWids = [];
      if (newPlanDetails?.plans && planIds) {
        newPlanDetails.plans.map((plan) => {
          const matchedItem = planIds.find(
            (item) => plan?.name === item?.node?.name,
          );
          if (matchedItem) {
            plansWids.push({ ...plan, plan_id: matchedItem.node.id });
          } else {
            plansWids.push({ ...plan });
          }
        });
      }
      let newData = {
        ...newPlanDetails,
        plans: plansWids,
        offerValidity: dateRange,
      };
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
              id: ids?.plan_group_id,
              productVariantIds: variantsToDelete,
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
              id: ids?.plan_group_id,
              productVariantIds: varientsToAdd,
            },
          },
        );

        const addVariantRes = await addVariantresponse.json();
      }
      const query = { _id: ids?.id };

      const update = {
        ...newData,
        shop: shop,
      };

      const options = { upsert: true, new: true, useFindAndModify: false };
      const doc = await planDetailsModel.findOneAndUpdate(
        query,
        update,
        options,
      );

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
};

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
        status: 400,
      };
    }
    const contractStatus = contractResult?.data?.subscriptionContract?.status;
    if (
      !["ACTIVE", "PAUSED", "FAILED"]?.includes(contractStatus?.toUpperCase())
    ) {
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

    const response = await admin.graphql(mutationQuery, { variables });

    const result = await response.json();

    if (result.data?.subscriptionContractCancel?.userErrors?.length > 0) {
      return {
        success: false,
        message: result.data.subscriptionContractCancel.userErrors[0].message,
        status: 400,
      };
    } else {

      let res = await subscriptionContractModel.findOneAndUpdate(
        { _id: data?.contractDbID },
        { $set: { status: "CANCELLED" } },
        { new: true },
      );
            
      await cancelContractMail({
        customerName: res?.customerName,
        productName: res?.products[0]?.productName,
        customerEmail: res?.customerEmail
      })

      return {
        success: true,
        result: "Successfully cancel plan.",
        data: result.data.subscriptionContractCancel,
        res: res,
      };
    }
  } catch (error) {

    return { success: false, error: "Failed to cancel plan." };
  }
};

export const getSubscriptions = async (admin, page, search) => {
  try {
    const { shop } = admin.rest.session;
    let skip = 0;
    let limitN = 50
    page > 1 ? (skip = (page - 1) * limitN) : (skip = 0);
    let total_data = 0;
    let details = [];
    if (search == "") {
      details = await subscriptionContractModel
        .find({ shop }).sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitN);
      total_data = await subscriptionContractModel
        .find({ shop })
        .countDocuments();
    } else {
      details = await subscriptionContractModel
        .find({
          shop: shop,
          customerName: { $regex: search, $options: "i" },
        }).sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitN);
      total_data = await subscriptionContractModel
        .find({
          shop: shop,
          customerName: { $regex: search, $options: "i" },
        })
        .countDocuments();
    }
    return {
      message: "success",
      details: details,
      status: 200,
      total: total_data,
    };
  } catch (error) {
    console.error("Error processing POST request:", error);
    return { message: "Error processing request", status: 500 };
  }
};

export const getConstractDetailById = async (admin, id) => {
  const { shop } = admin.rest.session;
  const details = await subscriptionContractModel.findOne({ shop, _id: id });
  // console.log("DB controller contract:", details);
  // return { message: "success", data: details, status: 200 };
  if (details?.contractId) {
    
    const query = `
              query {
                subscriptionContract(id: "gid://shopify/SubscriptionContract/${details?.contractId}") {
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
        status: 400,
      };
    }
    return {
      message: "success",
      shopifyData: contractResult.data.subscriptionContract,
      dbDetails: details,
      status: 200,
    };
  } else {
    return { message: "success", dbDetails: details, status: 200 };
  }
};
export const getCustomerDataByContractId = async (admin, id) => {
  const query = `{
          subscriptionContract(id: "gid://shopify/SubscriptionContract/${id}") {
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
                  }
                  customerLocale
                }
                customer {
                  firstName
                  lastName
                  id
                  email
                  phone
                  addresses {
                      phone
                        name
                        id
                        lastName
                  }
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
      status: 400,
    };
  }
  return {
    message: "success",
    data: contractResult.data.subscriptionContract,
    status: 200,
  };
};

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
    const matchingDocuments = await subscriptionContractModel.aggregate([
      {
        $match: {
          "ticketDetails.appliedForDetail.productId": data[0]
        }
      },
      {
        $project: {
          _id: 0,
          shop: 1,
          orderId: 1,
          contractId: 1,
          customerId: 1,
          customerName: 1,
          customerEmail: 1,
          customerPhone:1,
          orderHashId:1,
          appliedForDetail: {
            $filter: {
              input: "$ticketDetails.appliedForDetail",
              as: "detail",
              cond: {
                $and: [
                  { $eq: ["$$detail.productId", data[0]] },
                  {
                    $gte: [
                      { $toDate: "$$detail.appliedDate" },
                      startIST
                    ]
                  },
                  {
                    $lte: [
                      { $toDate: "$$detail.appliedDate" },
                      endIST
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    return { success: true, data: matchingDocuments };
  } catch (error) {
    console.error("Error processing POST request:", error);
    return { message: "Error processing request", status: 500 };
  }
};

const toIST = (dateString) => {
  const date = new Date(dateString);
  const offsetInMinutes = 330;
  return new Date(date.getTime() + offsetInMinutes * 60 * 1000);
};

export const checkMincycleComplete = async (detail) => {
  try {
    let data = await billingModel.find({
      contractId: detail?.id,
      status: "done",
    });

    let productAr = []
    let activeDraws = await planDetailsModel.find({ shop: detail?.shop, showOnPortal: true })
    activeDraws.map((item) => {
      item?.products.map((product) => {
        productAr.push({
          id: product.product_id,
          title: product.product_name,
          image: product.product_image,
          raffleType: item?.raffleType,
          spots: item?.spots,
        })
      })
    })

    return { message: "success", data, activeDraws: productAr };
  } catch (error) {
    console.error("Error processing POST request:", error);
    return { message: "Error processing request", status: 500 };
  }
};

export const getLiveRaffle = async (shop) => {
  // const { shop } = admin.rest.session;
  try {
    let productAr = []
    let activeDraws = await planDetailsModel.find({ shop: shop, showOnPortal: true })
    activeDraws.map((item) => {
      item?.products.map((product) => {
        productAr.push({
          id: product.product_id,
          title: product.product_name,
          image: product.product_image,
          raffleType: item?.raffleType,
          spots: item?.spots,
        })
      })
    })
    return { message: "success", activeDraws: productAr };
  } catch (error) {
    console.error("Error processing POST request:", error);
    return { message: "Error processing request", status: 500 };
  }
}
export const getAllContracts = async (admin) => {
  try {
    const { shop } = admin.rest.session;
    const details = await subscriptionContractModel.find({ shop });
    return { message: "success", details: details, status: 200 };
  } catch (error) {
    console.error("Error processing POST request:", error);
    return { message: "Error processing request", status: 500 };
  }
};
export const getSpecificContract = async (admin, id) => {
  try {
    const { shop } = admin.rest.session;
    const details = await subscriptionContractModel.findOne({ shop, _id: id });
    return { message: "success", data: details, status: 200 };
  } catch (err) {
    console.error("Error processing POST request:", error);
    return { message: "Error processing request", status: 500 };
  }
}

export const setDefaultTemplate = async (shop) => {
  try {
    let orderTemplate = {
      subject: "Your order is successfully done",
      from: "Membership App",
      footer: `Best Regards,
            Dyna dealers`,
      html: `p>Hi {{customerName}},</p>
            <p>Thankyou to order for <b>{{productName}}</b> which is your${" "}
            <b>{{interval}}</b> plan.</p>
            <p>Your have {{drawIdsLength}} chances for winning.</p>
            <p>Your Entry Numbers are:</p>
                    {{drawIdsList}}
           
            <pre>
            {{footer}}
          </pre>

          `,          
      monthlyHtml: `p>Hi {{customerName}},</p>
            <p>Thank you for joining the DynaDealer community and becoming a member!</p>
            <p>Members get automatic monthly entries to win our bikes. Your entries NEVER EXPIRE.</p>
            <p>Don't like the current giveaway bike? You can pool your entries in your dashboard and assign them to new giveaway bikes as we launch them.</p>
            <p>Members also get 10% off ALL Hard Parts and Apparel listed for sale on <a href="https://dynadealer.com/" style="color: blue; text-decoration: underline;">http://DynaDealer.com</a>.</p>
            <p>To access your member dashboard and manage your monthly entries, you'll need to create an account.</p>
            <p>Click <a href='https://dynadealer.com/account'  style="color: blue; text-decoration: underline;">HERE</a> to create your account now.</p>
            <p>From the dashboard, you will be able to do things like:</p>
          
            <ul>
              <li>Manage your monthly entries</li>
              <li>Apply entries to current, or new giveaways</li>
              <li>Change, pause, or cancel your subscription anytime</li>
            </ul>
            <p>And don't forget....</p>
            <ul>
              <li>Your monthly entries NEVER expire</li>
              <li>You get FREE Shipping & Delivery</li>
              <li>You get 10% OFF site-wide on apparel and parts</li>
            </ul>

            <p>Your have {{drawIdsLength}} chances for winning.</p>
            <p>Your Entry Numbers are:</p>
                    {{drawIdsList}}
         
            <pre>
            {{footer}}
          </pre>`,
      orderMailParameters: [
        {
          term: "{{customerName}}",
          description: `This specifies the customer's name.`,
        },
        {
          term: "{{productName}}",
          description:
            "This specifies the name of the product for which the order is placed.",
        },
        {
          term: "{{interval}}",
          description: "It Shows the billing interval of subscription.",
        },
        {
          term: "{{drawsLength}}",
          description:
            "It denotes the total number of entries (chances to win).",
        },
        {
          term: "{{drawIdsList}}",
          description: "This is list of the tickets.",
        },
        {
          term: "{{footer}}",
          description: "Email footer like contact or address.",
        },
      ],
    };
    let appliedTemplate = {
      subject: "Your tickets are applied succesfully.",
      from: "Membership App",
      footer: `Best Regards,
            Dyna dealers`,
      html: `
            <p>Hi {{customerName}},</p>

            <p>Your orderId is: {{orderId}}</p>
            <p>Your have {{drawIdsLength}} chances for winning.</p>
            <p>Here, the list of your ticket Entries which are applied for {{productName}} giveaway</p>
           
                {{drawIdsList}}
               
            <pre>
                {{footer}}
            </pre>`,

      appliedMailParameters: [
        {
          term: "{{customerName}}",
          description: `This specifies the customer's name.`,
        },
        {
          term: "{{productName}}",
          description:
            "This specifies the name of the product for which tickets are applied",
        },
        {
          term: "{{interval}}",
          description: "It Shows the billing interval of subscription.",
        },
        {
          term: "{{appliedLength}}",
          description:
            "It denotes the total number of entries (chances to win).",
        },
        {
          term: "{{appliedList}}",
          description: "This is list of the tickets.",
        },
        {
          term: "{{footer}}",
          description: "Email footer like contact or address.",
        },
      ],
    };
    let winningTemplate = {
      subject: "Congratulations, YOU ARE A WINNER!",
      from: "Membership App",
      footer: `Best Regards,
            Dyna dealers`,
      html: `<p>Hi {{customerName}},</p>
            <h4>Congratulations,</h4>
            
            <p>We are thrilled to inform you that <b>YOU ARE A WINNER!</b> </p>
            
            <p>As part of our exclusive <b>{{interval}}</b> plan, you have won a beautiful <b>{{productName}}</b>
            timeless piece that adds charm and elegance to any space.</p> 
            <p>Thank you for being a valued part of our community. We appreciate your participation and look forward to more exciting moments with you!

            If you have any questions, feel free to reach out.
            </p>
          <pre>
                {{footer}}
            </pre>
         `,

      winnerMailParameters: [
        {
          term: "{{customerName}}",
          description: `This specifies the customer's name.`,
        },
        {
          term: "{{productName}}",
          description:
            "This specifies the name of the product for which the order is placed.",
        },
        {
          term: "{{interval}}",
          description: "It Shows the billing interval of subscription.",
        },
        {
          term: "{{footer}}",
          description: "Email footer like contact or address.",
        },
      ],
    };
    let announcementTemplate = {
      subject: "🚨 Exclusive Raffle Alert – Don’t Miss Your Chance! 🚨",
      from: "Membership App",
      footer: `Best Regards,
            Dyna dealers`,
      html: `<p>Attention Valued Members!</p>
           
            <br>
            <p>We’re excited to announce this month’s exclusive Members-Only Raffle! 🎉</p>
             <br>
            <p>🔥 Prize: [Insert Prize Name]</p>
            <p>🎟 Entry Level: [Subscription Tier Required]</p>
            <p>📅 Spots Available: [Limited Spots]</p> <br>
            <p>As a valued subscriber, you’re automatically entered based on your membership tier. Want more chances to win? Upgrade your subscription or grab your spot before entries fill up!</b>
            timeless piece that adds charm and elegance to any space.</p> 
             <br>
            <p>Don’t miss out—once spots are gone, they’re gone! The winner will be announced on [Date].
            <br>
            <p>Good luck! </p>
             <br>
            </p>
            <pre>
                {{footer}}
            </pre>
         `,

      announcementMailParameters: [
        {
          term: "{{productName}}",
          description:
            "This specifies the name of the product for which the order is placed.",
        },
        {
          term: "{{footer}}",
          description: "Email footer like contact or address.",
        },
      ],
    };
    const templateExist = await templateModel?.findOne({ shop });
    if (!templateExist) {
      const newTemplate = await templateModel.create({
        shop: shop,
        orderTemplate: orderTemplate,
        appliedTemplate: appliedTemplate,
        winningTemplate: winningTemplate,
        announcementTemplate: announcementTemplate,
      });
      return { message: "success", newTemplate };
    } else {
      const newTemplate = await templateModel.findOneAndUpdate(
        { shop },
        {
          $set: {
            orderTemplate: orderTemplate,
            appliedTemplate: appliedTemplate,
            winningTemplate: winningTemplate,
            announcementTemplate: announcementTemplate,
          },
        },
        { upsert: true, new: true },
      );
      return { message: "success", newTemplate };
    }
  } catch (error) {
    console.error("Error processing POST request:", error);
    return { message: "Error processing request", status: 500 };
  }
};
export const getEmailTemplate = async (admin) => {
  try {
    const { shop } = admin.rest.session;
    const data = await templateModel.findOne({ shop });
    return { message: "success", data };
  } catch (error) {
    console.error("Error processing POST request:", error);
    return { message: "Error processing request", status: 500 };
  }
};
export const updateTemplate = async (admin, data) => {
  try {
    const { shop } = admin.rest.session;
    const template = await templateModel.findOneAndUpdate(
      { shop },
      { $set: { ...data } },
      { upsert: true, new: true },
    );
    return { message: "success", template };
  } catch (error) {
    console.error("Error processing POST request:", error);
    return { message: "Error processing request", status: 500 };
  }
};



export const updateDb=async(admin)=>{
  try{
    // const {skip, limit} = check
    const { shop } = admin.rest.session;
let data= await subscriptionContractModel.find({shop}, {orderId:1, _id:0}).sort({createdAt:-1}).skip(0).limit(500)

data.forEach(async(item)=>{
  const query = `{
  order(id: "gid://shopify/Order/${item?.orderId}") {
    id
    name
    email
    createdAt
    totalPrice
    customer {
      id
      firstName
      lastName
      email
      phone
    }
  }
}
`;
  const orderRes = await admin.graphql(query);
  const orderResponse = await orderRes.json();
  
    const newData = orderResponse?.data?.order;
if(newData){

  const detailUpdate = await subscriptionContractModel.updateMany(
    { shop, orderId: item?.orderId },
    {
      $set: {
        customerPhone: newData?.customer?.phone || null,
        orderHashId: newData?.name || null,
        totalPrice: parseFloat(newData?.totalPrice) || 0,
      },
    },
    { new: true } // returns the updated document
  );
}

})
  return { message: "success" };     
  } catch (error) {
    console.error("Error processing POST request:", error);
    return { message: "Error processing request", status: 500 };
  }
}





// export const updateDocument = async (admin) => {
//   try {
//     const { shop } = admin.rest.session;
//     console.log("shop==", shop)
//     const ids = ['5932976799958'];

//     console.log("IDs to update:", ids);

//     for (const id of ids) {
//       console.log("Processing Order ID:", id);

//       const exist = await subscriptionContractModel.findOne({ shop, orderId: id });
//       if (!exist) {
//         console.log(`No record found for orderId: ${id}`);
//         continue;
//       }

//       console.log("Existing document:", exist);

//       // Generate new draw IDs equal to existing drawIds length
//       if(exist?.drawIds?.length<19){

//         const newDrawIds = Array.from({ length: exist.drawIds.length }, () =>
//           (
//             Date.now().toString(36).substring(0, 4) +
//             Math.random().toString(36).substring(2, 5)
//           )
//             .toUpperCase()
//             .substring(0, 7)
//         );
//            console.log("newDrawIds",newDrawIds)
//          const updateResult = await subscriptionContractModel.updateOne(
//           { shop, orderId: id },
//           {
//             $push: {
//               drawIds: { $each: newDrawIds },
//               "ticketDetails.totalTicketsList": { $each: newDrawIds },
//               "ticketDetails.appliedTicketsList": { $each: newDrawIds },
//               "ticketDetails.appliedForDetail.0.appliedList": { $each: newDrawIds }
//             },
//             $inc: {
//               "ticketDetails.total": newDrawIds.length,
//               "ticketDetails.applied": newDrawIds.length,
//               "ticketDetails.appliedForDetail.0.tickets": newDrawIds.length
//             },
//             $set: {
//               updatedAt: new Date()
//             }
//           }
//         );
//          const billingResult = await billingModel.updateOne(
//           { shop, orderId: id },
//           {
//             $push: {
//               drawIds: { $each: newDrawIds },
//             },
//             $set: {
//               updatedAt: new Date()
//             }
//           }
//         );
  
//         console.log("Update successful:", updateResult, billingResult);
//       }else{
//         console.log("updated before")
//       }
  
//     }
//     return { message: "Documents updated successfully", status: 200 };

//   } catch (error) {
//     console.error("Error updating documents:", error);
//     return { message: "Error processing request", status: 500 };
//   }
// };


// export const getOrders = async (admin) => {
//   try {
//     const { shop } = admin.rest.session;
//     let packageOrders = ['#3789', '#3753']
//     // let normal = ["#3794", '#3778', '#3777', '#3775', '#3772', '#3771', '#3767', '#3766', '#3759', '#3740', '#3729', '#3718', '#3712', '#3682']
    
//     for (let id of packageOrders) {

//       console.log("id==", id)
//       const query = `{
//     orders(query: "name:${id}", first: 5) {
//       edges {
//         node {
//           id
//           name
//           email
//           createdAt
//           totalPrice
//           customer {
//             id
//             email
//             firstName
//             lastName
//           }
//           lineItems(first: 10) {
//             nodes {
//               id
//               name
//               quantity
//               product {
//                 id
//                 title
//                 handle
//               }
//             }
//           }
//         }
//       }
//     }
//   }`
//       const ordersResponse = await admin.graphql(query);
//       const ordersResult = await ordersResponse.json();

//       const dataString = typeof ordersResult === "string" ? ordersResult : JSON.stringify(ordersResult);
//       fs.writeFile("checkkkk.txt", dataString, (err) => {
//         if (err) {
//           console.error("Error writing to file:", err);
//         } else {
//           console.log("Data written to file successfully!");
//         }
//       });
//       if (ordersResult?.data?.orders?.userErrors?.length > 0) {
//         return {
//           message: "error",
//           data: ordersResult.data.orders.userErrors[0].message,
//           status: 400,
//         };
//       }
//       if (ordersResult?.data?.orders?.edges[0]?.node) {
//         let data = ordersResult?.data?.orders?.edges[0]?.node
//         console.log(data?.id, data?.customer?.firstName)
//         let exist = await subscriptionContractModel?.findOne({ shop, orderId: data?.id?.split('gid://shopify/Order/')[1] })
//         console.log(" exist?.orderId==", exist?.orderId)
//         let drawIds = [];
//         let entries =  parseInt(35)* Number(data?.lineItems?.nodes[0]?.quantity) 
//         console.log(Number(data?.lineItems?.nodes[0]?.quantity),"entries===",packageOrders.includes(id), entries)
//         if (!exist) {
//           for (let i = 0; i < entries; i++) {
//             // let unique = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
//             let unique = (
//               Date.now().toString(36).substring(0, 4) +
//               Math.random().toString(36).substring(2, 5)
//             )
//               .toUpperCase()
//               .substring(0, 7);
//             drawIds.push(unique);
//           }

//           let ticketDetails = {
//             total: Number(drawIds?.length),
//             totalTicketsList: drawIds,
//             applied: Number(drawIds?.length),
//             appliedTicketsList: drawIds,
//             available: 0,
//             availableTicketsList: [],
//             appliedForDetail: [
//               {
//                 tickets: Number(drawIds?.length),
//                 productId: "gid://shopify/Product/8848887546070",
//                 productName: "Digital Download for Giveaway #6 Entry",
//                 appliedDate: data?.createdAt,
//                 appliedList: drawIds,
//               },
//             ],
//           };


//           let contractDetail = await subscriptionContractModel.create({
//             shop: shop,
//             orderId: data?.id?.split('gid://shopify/Order/')[1],
//             contractId: "",
//             customerName:
//               data?.customer?.firstName?.trim() +
//               " " +
//               data?.customer?.lastName?.trim(),
//             customerEmail: data?.customer.email,
//             customerId: data?.customer?.id?.split("gid://shopify/Customer/")[1],
//             planUpdateDetail: {
//               sellingPlanUpdate: false,
//               upgradeTo: "",
//               futureEntries: 0,
//             },
//             billing_policy: {
//               interval: "onetime",
//               interval_count: 1,
//               min_cycles: 1,
//             },
//             products: [
//               {
//                 productId: data?.lineItems?.nodes[0].product?.id,
//                 productName: data?.lineItems?.nodes[0].product?.title,
//                 price: data?.totalPrice,
//                 currency: "USD",
//                 quantity: data?.lineItems?.nodes[0]?.quantity,
//                 entries: drawIds?.length,
//               },
//             ],
//             drawIds: drawIds,
//             status: "ONETIME",
//             nextBillingDate: new Date().toISOString(),
//             ticketDetails: ticketDetails,
//             // createdAt: data?.createdAt,
//             // updatedAt: data?.createdAt
//           });

//           console.log("contract cretaed successfully")
//           const currentDate = new Date().toISOString();
//           let billing = await billingModel.create({
//             shop: shop,
//             orderId: data?.id?.split('gid://shopify/Order/')[1],
//             contractId: "",
//             customerName:
//               data?.customer?.firstName?.trim() +
//               " " +
//               data?.customer?.lastName?.trim(),
//             customerEmail: data?.customer.email,
//             customerId: data?.customer?.id?.split("gid://shopify/Customer/")[1],
//             products: [
//               {
//                 productId: data?.lineItems?.nodes[0].product?.id,
//                 productName: data?.lineItems?.nodes[0].product?.title,
//                 price: data?.totalPrice,
//                 currency: "USD",
//                 quantity: data?.lineItems?.nodes[0]?.quantity,
//                 entries: drawIds?.length,
//               },
//             ],
//             billing_policy: {
//               interval: "onetime",
//               interval_count: 1,
//               min_cycles: 1,
//             },
//             entries: drawIds?.length,
//             planUpdateDetail: {
//               sellingPlanUpdate: false,
//               upgradeTo: "",
//               futureEntries: 0,
//             },
//             drawIds: drawIds,
//             status: "done",
//             billing_attempt_date: data?.createdAt,
//             renewal_date: data?.createdAt,
//             applied: false,
//           });
//           console.log("biling cretaed successfully")

//           await sendOrderEmail(contractDetail);

//         }
//       }
//     }
//     return;
//   } catch (error) {
//     console.error("Error processing POST request:", error);
//     return { message: "Error processing request", status: 500 };
//   }
// }




//     const query = `{
//   orders(first: 1) {
//     edges {
//       cursor
//       node {
//         id
//         email
//         createdAt
//         currencyCode
//         customer {
//           email
//           firstName
//           lastName
//           id
//           updatedAt
//         }
//         name
//         lineItems(first: 10) {
//           nodes {
//             id
//             name
//             product {
//               handle
//               id
//               title
//             }
//             quantity
//           }
//         }
//         totalPrice
//         subtotalPrice
//       }
//     }
//     pageInfo {
//       hasNextPage
//       hasPreviousPage
//       startCursor
//       endCursor
//     }
//   }
// }`;
