import { credentialModel } from "../schema";

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
   
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



        return new Response(JSON.stringify({ message: "success", data: result.data }), {
            status: 200,
            headers
        });
    } catch (error) {
        console.error("Error processing POST request:", error);
        return json({ message: "Error processing request" }, {
            status: 500,
            headers,
        });
    }
};
