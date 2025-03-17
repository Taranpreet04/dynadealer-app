import {
  billingModel,
  planDetailsModel,
  subscriptionContractModel,
  templateModel,
} from "../schema";
// import fs from "fs";


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

export const createPlanAndVariants = async (admin, newPlanDetail) => {
  let onetimePlans=[]
  let otherPlans=[]
  // newPlanDetail?.plans?.map((plan)=>{
  //   plan?.purchaseType=='day'? onetimePlans.push(newPlanDetail)
  // })
  let optionExist = await checkOptions(admin, newPlanDetail?.products[0]?.product_id)
  console.log("result----checkOptions-exist", optionExist)
  if (optionExist) {
    console.log("time to create variants")
    // createVariants()
  } else {
    let option = await createOption(admin, newPlanDetail?.products[0]?.product_id)
    console.log("option==", option)
  }
}
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
    endIST = toIST(endIST);

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
            minCycles: item?.mincycle ? parseFloat(item?.mincycle) : 1,
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
    // const dataString = typeof result === "string" ? result : JSON.stringify(result);
    // fs.writeFile("checkkkk.txt", dataString, (err) => {
    //     if (err) {
    //         console.error("Error writing to file:", err);
    //     } else {
    //         console.log("Data written to file successfully!");
    //     }
    // });
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
const checkOptions = async (admin, productId) => {
  try {
    console.log("productId==", productId)
    const query = `query {
    product(id: "${productId}") {
      options {
        id
        name
        values
      }
    }
  }`;
    const response = await admin.graphql(query);
    const productOptions = await response.json();
    // const dataString = typeof productOptions === "string" ? productOptions : JSON.stringify(productOptions);
    // fs.writeFile("checkkkk.txt", dataString, (err) => {
    //   if (err) {
    //     console.error("Error writing to file:", err);
    //   } else {
    //     console.log("Data written to file successfully!");
    //   }
    // });
    let totalOptions = productOptions?.data?.product?.options.length
    if (totalOptions > 0) {
      const ticketOption = productOptions?.data?.product?.options?.find(
        option => option?.name === "Tickets"
      );

      console.log("Ticket Option ID:", ticketOption?.id);
      return ticketOption?.id;
    }

    return null;
  } catch (err) {

  }
}
export const createOption = async (admin, productId) => {
  try {
    const mutation = `#graphql
  mutation createOptions($productId: ID!, $options: [OptionCreateInput!]!) {
    productOptionsCreate(productId: $productId, options: $options) {
      userErrors {
        field
        message
        code
      }
      product {
        id
        title
        options {
          name
          values
        }
      }
    }
  }`;

    const variables = {
      productId: productId,
      options: [
        {
          name: "Tickets",
          values: [
            {
              name: "1 Entry",
            },
          ],
        },
      ],
    };

    const response = await admin.graphql(mutation, { variables });

    const data = await response.json();
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    // fs.writeFile("checkkkk.txt", dataString, (err) => {
    //   if (err) {
    //     console.error("Error writing to file:", err);
    //   } else {
    //     console.log("Data written to file successfully!");
    //   }
    // });
    // console.log(data);
    if (data?.data?.productOptionsCreate?.userErrors?.length <= 0) {
      console.log("no reeor")
      return true
    }
    console.log("err", data?.data?.productOptionsCreate?.userErrors)
    return false
  } catch (err) {
    console.log(err)
    return false
  }


}
export const updatePlanById = async (admin, ids, newPlanDetails, data) => {

  try {
    const { shop } = admin.rest.session;
    console.log("data--", data)
    let dbproductlist = data?.dbProducts;
    console.log("dbproductlist==", dbproductlist)
    const date = newPlanDetails?.offerValidity;
    const startIST = toIST(date.start);
    let endIST = toIST(date.end);
    endIST.setHours(23, 59, 59, 999);
    endIST = toIST(endIST);

    let dateRange = {
      start: startIST,
      end: endIST,
    };

    let storefrontDescription = {
      dateRange: dateRange,
      raffleType: newPlanDetails?.raffleType,
      spotsPerPerson: newPlanDetails?.spots,
    };

    // checkOptions(admin, product_id)
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
    page > 1 ? (skip = (page - 1) * 10) : (skip = 0);
    let total_data = 0;
    let details = [];
    if (search == "") {
      details = await subscriptionContractModel
        .find({ shop })
        .skip(skip)
        .limit(10);
      total_data = await subscriptionContractModel
        .find({ shop })
        .countDocuments();
    } else {
      details = await subscriptionContractModel
        .find({
          shop: shop,
          customerName: { $regex: search, $options: "i" },
        })
        .skip(skip)
        .limit(10);
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
      status: 400,
    };
  }
  return {
    message: "success",
    data: contractResult.data.subscriptionContract,
    status: 200,
  };
};
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
            <p>Note: You must apply for tickets through the customer portal; otherwise, they will not be included in the lucky draw listing.</p>
               <p>Steps to apply for tickets-</p>

               <li>First Login to your customer portal.</li>
               <li>Then click on Mange Memberships box.</li>
               <li>Now you will able to see your orders list.</li>
               <li>Each order has a view icon that you need to click on it and apply your tickets to getting chances for lucky draws</li>
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
          term: "{{billingInterval}}",
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
            <p>Your contractId is: {{contractId}}</p>
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
          term: "{{date}}",
          description: "date start or end date",
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


