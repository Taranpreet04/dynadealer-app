import { checkMincycleComplete } from '../controllers/planController'
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
        let details = await checkMincycleComplete(data)
        if (details?.message == "success") {
            return new Response(JSON.stringify({ message: "success", details: details?.data, activeDraws: details?.activeDraws}), {
                status: 200,
                headers
            });
        } else {
            return new Response(JSON.stringify({ message: "failed", details: details.data , activeDraws: details?.activeDraws}), {
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






















