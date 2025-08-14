import { getMultiplierData } from "../controllers/planController";


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
  //  const { session } = await unauthenticated.admin(request);
  console.log("shop in loader ===>", shop);
  const response = await getMultiplierData(shop);
  console.log("response in loader ===>", response);
  if (response.status !== 200) {
    return {
      isManualEnabled: false,
      isAllEnabled: false,
      allProductMultiplier: "",
      products: [],
    };
  }

  //   return {
  //     isManualEnabled:
  //       response.data.isManualEnabled === "true" ||
  //       response.data.isManualEnabled === true,
  //     isAllEnabled:
  //       response.data.isAllEnabled === "true" ||
  //       response.data.isAllEnabled === true,
  //     allProductMultiplier: response.data.allProductMultiplier || "",
  //     products: response.data.products || [],
  //     };

  return new Response(
    JSON.stringify({
      isManualEnabled:
        response.data.isManualEnabled === "true" ||
        response.data.isManualEnabled === true,
      isAllEnabled:
        response.data.isAllEnabled === "true" ||
        response.data.isAllEnabled === true,
      allProductMultiplier: response.data.allProductMultiplier || "",
      products: response.data.products || [],
    }),
    {
      status: 200,
      headers,
    },
  );
};
