import { subscriptionContractModel } from "../schema"

export const action =async({request})=>{
    const data = await request.json(); 
    try {
       let details= await subscriptionContractModel.find({customerId: data?.cid})
        return new Response(JSON.stringify({ message: "success", details: details }), {
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




















