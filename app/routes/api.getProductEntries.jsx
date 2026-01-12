import { getProductEntries } from "../controllers/planController";
import { unauthenticated } from "../shopify.server";
const headers = {
  "Access-Control-Allow-Credentials": "true",
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const id = url.searchParams.get("productId");
  const { admin } = await unauthenticated.admin(shop);
  console.log("shop in loader ===>", shop);
  const productId = `gid://shopify/Product/${id}`;
  const response = await getProductEntries(admin, productId);
  console.log("response in loader ===>", response);

  return new Response(
    JSON.stringify(response),

    {
      status: 200,
      headers,
    },
  );
};
