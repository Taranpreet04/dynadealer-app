import path from "path";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

export const loader = async () => {
  const customerPortalCssPath = path.join(
    process.cwd(),
    "public",
    "css",
    "customer.portal.css"
  );

  const fileStat = await stat(customerPortalCssPath);

  const fileStream = createReadStream(customerPortalCssPath);

  const headers = new Headers();
  headers.set("Content-Type", "text/css");
  headers.set("Content-Length", fileStat.size);

  return new Response(fileStream, {
    headers,
    status: 200,
  });
};
