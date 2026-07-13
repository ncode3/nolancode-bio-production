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

  const siteKey = process.env.TURNSTILE_SITE_KEY || "";

  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: {
      siteKey,
      turnstileEnabled: Boolean(siteKey)
    }
  };
};
