import { planDetailsModel } from "../schema"

export const action = async ({ request }) => {
    const data = await request.json();
    try {
        const id = `gid://shopify/Product/${data.productId}`
        const check = await planDetailsModel.findOne({
            "products.product_id": id,
        });
        return new Response(JSON.stringify({ message: "success", offerValidity: check.offerValidity }), {
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
}