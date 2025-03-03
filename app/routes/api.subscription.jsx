
//APp--proxy
export const loader = async ({ request }) => {
  try {
    
    const url = new URL(request.url);
    const cid = url.searchParams.get("cid");

    const responseData = {
      message: "Subscription data for cid: " + cid,
    };

    const shop= "https://dynadealersapp.com"
    const liquidContent = `<html>
      <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>   
      <script src="${shop}/api/customerPortalJs"></script> 
      <link rel="stylesheet" href="${shop}/api/customerPortalCss">
      </head>
      <body>
      <div id="subscription-main-body"></div>
      </body>
      </html>`;

    const response = new Response(liquidContent, {
      headers: {
        "Content-Type": "application/liquid",
      },
    });

    return response;

  } catch (error) {
    console.error("Error in loader:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
