import { planDetailsModel } from "../schema";

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

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (!shop) {
      return Response.json(
        { error: "Missing required shop parameter" },
        { status: 400, headers },
      );
    }

    const { session } = await unauthenticated.admin(shop);

    if (!session?.shop) {
      return Response.json(
        { error: "Unauthorized shop access" },
        { status: 401, headers },
      );
    }

    const result = await planDetailsModel.find({ shop, name }).lean();

    return Response.json(
      {
        success: true,
        data: result,
      },
      { headers },
    );
  } catch (error) {
    console.error("Loader error:", error);

    return Response.json(
      { success: false, error: "Internal Server Error" },
      { status: 500, headers },
    );
  }
};
