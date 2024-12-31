import { cancelContract } from "../controllers/planController";
import { unauthenticated } from '../shopify.server';

export const action = async ({ request }) => {
    const data = await request.json();
    try {
        const { admin } = await unauthenticated.admin(data.shop);
        if (!admin) {
            return new Response(
                JSON.stringify({ message: "Invalid Shopify shop" }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        let res = await cancelContract(admin, data);

        return new Response(JSON.stringify({ message: "success", data: res }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
    catch (error) {
        console.error("Error processing POST request:", error);
        return new Response(JSON.stringify({ message: "Error processing request" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}