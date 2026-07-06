module.exports = async function (context, req) {
  if (req.method !== "GET") {
    context.res = {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: { message: "Method not allowed." }
    };
    return;
  }

  context.res = {
    status: process.env.TURNSTILE_SITE_KEY ? 200 : 503,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: {
      siteKey: process.env.TURNSTILE_SITE_KEY || ""
    }
  };
};
