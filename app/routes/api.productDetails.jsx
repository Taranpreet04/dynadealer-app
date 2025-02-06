import { credentialModel } from "../schema";


export const action = async ({ request }) => {
    try {
        const data = await request.json();
        console.log("data==", data)
        const shop = data?.shop;
        const productId = "gid://shopify/Product/" + data?.productId;

        const res = await credentialModel.findOne({ shop: shop })
        const accessToken = res?.accessToken
        const response = await fetch(
            `https://${shop}/admin/api/2023-10/graphql.json`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify({
                    query: `
                query ProductMetafield($ownerId: ID!) {
                  product(id: $ownerId) {
                    totalInventory
                    title
                    tags
                    status
                  }
                }
              `,
                    variables: {
                        ownerId: productId,
                    },
                }),
            }
        );

        const result = await response.json();


        console.log("fetchDetail==", result.data)


        return new Response(JSON.stringify({ message: "success", data: result.data }), {
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
