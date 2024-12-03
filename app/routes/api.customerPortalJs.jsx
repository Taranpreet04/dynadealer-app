import path from "path";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

export const loader = async () => {
  const customerPortalScriptPath = path.join(
    process.cwd(),
    "public",
    "js",
    "customer.portal.js"
  );
  const fileStat = await stat(customerPortalScriptPath);

  const fileStream = createReadStream(customerPortalScriptPath);

  const headers = new Headers();
  headers.set("Content-Type", "application/javascript");
  headers.set("Content-Length", fileStat.size);

  return new Response(fileStream, {
    headers,
    status: 200,
  });
};
