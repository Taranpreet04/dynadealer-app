// import { subscriptionContractModel } from "../schema"
import {checkMincycleComplete} from '../controllers/planController'
export const action =async({request})=>{
    const data = await request.json(); 
    try {
        console.log("data- in check cancel", data)
       let details= await checkMincycleComplete(data)
       if(details?.message=="success"){
           return new Response(JSON.stringify({ message: "success", details: details?.data }), {
               status: 200,
               headers: {
                   "Content-Type": "application/json",
               },
           });
       }else{
        return new Response(JSON.stringify({ message: "failed", details: details.data }), {
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




















