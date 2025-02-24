import { planDetailsModel } from "../schema"
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
    console.log("data==", data)
    try {
        if(data?.productId){
            const id = `gid://shopify/Product/${data?.productId}`
            const check = await planDetailsModel.findOne({
                "products.product_id": id,
            });
            console.log("check=", check, check.offerValidity)
            return new Response(JSON.stringify({ message: "success", offerValidity: check.offerValidity }), {
                status: 200,
                headers
            });
        }else if(data?.allProductId){
            let pid=[]
            data.allProductId.map((id)=>{
                pid.push(`gid://shopify/Product/${id}`)
            })
            const check = await planDetailsModel.find({
               "products.product_id": { $in: pid },
            },{offerValidity:1, products: 1});
           
            let result=[]
            check.map((itm)=>{
                itm?.products?.map((product)=>{
                    result.push({
                        id: product.product_id.split('Product/')[1],
                        pid: product.product_id,
                        name: product.product_name,
                        offerValidity: itm.offerValidity
                    })
                })
            }) 
            return new Response(JSON.stringify({ message: "success", data:result}), {
                status: 200,
                headers
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