import { membershipsModel } from "../schema";
import { unauthenticated } from "../shopify.server";

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
export const action= async({request})=>{
    const data = await request.json();
    try{
     
        const { admin } = await unauthenticated.admin(data.shop);
        if (!admin) {
            return new Response(
                JSON.stringify({ message: "Invalid Shopify shop" }),
                {
                    status: 401,
                    headers
                }
            );
        }

        let res = await membershipsModel.findOne({shop: data?.shop, customerId: data?.customerId})
        if(res){
            return new Response(JSON.stringify({ message: "success", data: res }), {
                status: 200,
                headers
            });
        }else{
            return new Response(JSON.stringify({ message: "success", data: {}  }), {
                status: 200,
                headers
            });
        }
    }catch(error){
        console.error("Error processing POST request:", error);
        return json({ message: "Error processing request" }, {
            status: 500,
            headers,
        });
    }
}
