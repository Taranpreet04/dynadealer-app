

import { billingModel, subscriptionContractModel } from "../schema";
import { unauthenticated } from '../shopify.server';

export async function recurringOrderCron() {
    console.log('You will see this message every hours*******', new Date());
    const currentDate = new Date().toISOString();
    const targetDate = new Date(currentDate);
    try {

        let data = await subscriptionContractModel.find(
            {
                $and: [
                    {
                        $expr: {
                            $eq: [
                                {
                                    $dateToString: { format: "%Y-%m-%d", date: "$nextBillingDate" },
                                },

                                { $dateToString: { format: "%Y-%m-%d", date: targetDate } },
                            ],
                        },
                    },

                    { status: "ACTIVE" },
                ],
            },

        );

        if (data.length > 0) {
            const { admin } = await unauthenticated.admin(data[0]?.shop);
            for (let i = 0; i < data.length; i++) {
                const uniqueId = i + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);  
                let id = `gid://shopify/SubscriptionContract/${data[i].contractId}`
                const response = await admin.graphql(
                    `#graphql
                            mutation subscriptionBillingAttemptCreate($contractId: ID!, $index: Int!) {
                            subscriptionBillingAttemptCreate(subscriptionContractId: $contractId, subscriptionBillingAttemptInput: {billingCycleSelector: {index: $index}, idempotencyKey: "${uniqueId}", originTime: "${currentDate}"}) {
                            subscriptionBillingAttempt {
                                id
                                ready
                            }
                            userErrors {
                                field
                                message
                            }
                        }
                    }`,
                    {
                        variables: {
                            "contractId": `${id}`,
                            "index": 1
                        },
                    },
                );
                const billingAttempt = await response.json();
                if (billingAttempt.data.subscriptionBillingAttemptCreate.subscriptionBillingAttempt.id) {
                    const currentDate = new Date().toISOString();
                    let entries = Number(data[i]?.sellingPlanName?.split('-entries-')?.[1]) * 1
                    let drawIds = []
                    for (let i = 0; i < entries; i++) {
                        let unique = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
                        drawIds.push(unique)
                    }
                    let saveToBillingAttempt = await billingModel.create({
                        shop: data[i].shop,
                        status: "PENDING",
                        products: data[i]?.products,
                        contractId: data[i]?.contractId,
                        customerEmail: data[i]?.customerEmail,
                        billing_attempt_date: currentDate,
                        renewal_date: currentDate,
                        billing_attempt_id: billingAttempt?.data?.subscriptionBillingAttemptCreate?.subscriptionBillingAttempt?.id,
                        idempotencyKey: uniqueId,
                        orderId: data[i]?.orderId,
                        customerId: data[i]?.customerId,
                        customerName: data[i]?.customerName,
                        drawIds: drawIds,
                        entries: entries || 1
                    });
                    const originalDate = new Date(currentDate);
                    let nextDate;
                    if (data[i].billing_policy.interval.toLowerCase() === "day") {
                        nextDate = new Date(originalDate);
                    } else if (data[i].billing_policy.interval.toLowerCase() === "month") {
                        nextDate = new Date(originalDate);
                        nextDate.setMonth(nextDate.getMonth() + 1);
                    } else if (data[i].billing_policy.interval.toLowerCase() === "week") {
                        nextDate = new Date(originalDate);
                        nextDate.setDate(nextDate.getDate() + 7);
                    } else if (data[i].billing_policy.interval.toLowerCase() === "year") {
                        nextDate = new Date(originalDate);
                        nextDate.setFullYear(nextDate.getFullYear() + 1 * parseInt(value));
                    }
                    let updateNextBillingDate = await subscriptionContractModel.findOneAndUpdate(
                        { shop: data[i].shop, contractId: data[i].contractId },
                        {
                            $set: {
                                nextBillingDate: nextDate.toISOString(),
                            },
                        }
                    );
                }
            }
        }
    } catch (err) {
        console.log("Error occor in cron-job", err)
    }
}

