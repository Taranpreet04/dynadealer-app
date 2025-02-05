import { sendApplyEmail } from '../controllers/mail';
import { checkMincycleComplete } from '../controllers/planController'
import { billingModel } from '../schema';
export const action = async ({ request }) => {
    const data = await request.json();
    try {
        console.log("data?.flag==", data)
        if (data) {
            let details = await billingModel.findOneAndUpdate(
                { _id: data._id }, 
                { $set: data },    
                { new: true, upsert: true, setDefaultsOnInsert: true } 
            );

            console.log("details==", details)
           let res= sendApplyEmail(data)
            return new Response(JSON.stringify({ message: "success", details: details }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            });
        }
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






















