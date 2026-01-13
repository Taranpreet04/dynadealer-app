import { planDetailsModel } from "../schema";
import { json } from '@remix-run/node';

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const loader = async ({ request }) => {
  const { unauthenticated } = await import("../shopify.server");

  console.log("----------start loader-----------------");

  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const name = url.searchParams.get("pageName");

    console.log("url ====>>>>  ",url)
    console.log("shop ====>>>>  ",shop)
    console.log("name ====>>>>  ",name)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    console.log("------------111111111111---------------------")

    if (!shop) {
      return json(
        { error: "Missing required shop parameter" },
        { status: 400, headers },
      );
    }

    console.log("------------22222222222---------------------")


    const { session } = await unauthenticated.admin(shop);


    console.log("------------session---------------------")
    console.log("------------session?.shop---------------------",session?.shop)


    if (!session?.shop) {
      return json(
        { error: "Unauthorized shop access" },
        { status: 401, headers },
      );
    }

    const result = await planDetailsModel.find({ shop, name }).lean();

    console.log("result =====>>",result)

    return json(
      {
        success: true,
        data: result,
      },
      { headers },
    );
  } catch (error) {
    console.error("Loader error:", error);

    return json(
      { success: false, error: "Internal Server Error" },
      { status: 500, headers },
    );
  }
};
