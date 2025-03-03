import { json } from '@remix-run/node';
// import { sendApplyEmail } from '../db.mailcontroller';
import { billingModel } from '../schema';

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
    const data = await request.json();
    try {
       
        if (data) {
            let details = await subscriptionContractModel.findOneAndUpdate(
                { _id: data._id , contractId: data.contractId }, 
                { $set: data },    
                { new: true, upsert: true, setDefaultsOnInsert: true } 
            );

            console.log("details==", details)
          //  let res= sendApplyEmail(data)
            // return new Response(JSON.stringify({ message: "success", details: details }), {
            //     status: 200,
            //     headers,
            // });
            return json({ message: "success", details: details }, {
                status: 200,
                headers,
              });
        }
    } catch (error) {
        console.error("Error processing POST request:", error);
       
        return json({ message: "Error processing request" }, {
            status: 500,
            headers,
          });
    }
}
