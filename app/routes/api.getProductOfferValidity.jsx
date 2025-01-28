import { planDetailsModel } from "../schema"

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
                headers: {
                    "Content-Type": "application/json",
                },
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