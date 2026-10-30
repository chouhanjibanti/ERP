import serverless from "serverless-http";
import apiApp from "../../../src/server/api/index.js";
import { erp } from "../../../src/server/api/dbconnection.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const expressHandler = serverless(apiApp, {
  binary: ["application/pdf", "application/octet-stream", "image/*"],
});

const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

async function handle(request, context) {
  const { path = [] } = await context.params;
  const pathname = `/${path.map(encodeURIComponent).join("/")}`;
  const requestUrl = new URL(request.url);
  const isPublicFile = path[0] === "images" || path[0] === "uploads";

  if (!isPublicFile) {
    try {
      await erp();
    } catch (error) {
      console.error("ERP database connection failed:", error);
      return Response.json(
        { success: false, msg: "The ERP database is unavailable." },
        { status: 503 },
      );
    }
  }

  const headers = Object.fromEntries(
    Array.from(request.headers.entries()).filter(
      ([name]) => !hopByHopHeaders.has(name.toLowerCase()),
    ),
  );
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : Buffer.from(await request.arrayBuffer()).toString("base64");

  try {
    const result = await expressHandler({
      version: "2.0",
      rawPath: pathname,
      rawQueryString: requestUrl.search.slice(1),
      headers,
      body,
      isBase64Encoded: body !== undefined,
      requestContext: {
        http: {
          method: request.method,
          path: pathname,
          protocol: "HTTP/1.1",
          sourceIp: "127.0.0.1",
          userAgent: request.headers.get("user-agent") || "",
        },
      },
    });

    const responseHeaders = new Headers();
    for (const [name, value] of Object.entries(result.headers || {})) {
      if (name.toLowerCase() !== "set-cookie" && value != null) {
        responseHeaders.set(name, String(value));
      }
    }

    const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);
    const cookies = [
      ...asArray(result.cookies),
      ...asArray(result.multiValueHeaders?.["set-cookie"]),
      ...asArray(result.multiValueHeaders?.["Set-Cookie"]),
    ];
    const singleCookie = result.headers?.["set-cookie"] || result.headers?.["Set-Cookie"];
    if (singleCookie && cookies.length === 0) {
      cookies.push(...(Array.isArray(singleCookie) ? singleCookie : [singleCookie]));
    }
    for (const cookie of cookies) {
      responseHeaders.append("set-cookie", cookie);
    }

    const status = result.statusCode || 200;
    const responseBody = result.isBase64Encoded
      ? Buffer.from(result.body || "", "base64")
      : result.body || null;

    return new Response(
      [204, 205, 304].includes(status) ? null : responseBody,
      { status, headers: responseHeaders },
    );
  } catch (error) {
    console.error(`Next.js ERP API handler failed for ${request.method} ${pathname}:`, error);
    return Response.json(
      { success: false, msg: "The ERP API request could not be completed." },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
