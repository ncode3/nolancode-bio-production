const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_ALLOWED_URLS = 2;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitStore = new Map();

function json(status, body) {
  return {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body
  };
}

function normalize(value) {
  return String(value || "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function countUrls(message) {
  const matches = message.match(/\b(?:https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})(?:[^\s]*)/gi);
  return matches ? matches.length : 0;
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"] || "";
  return normalize(forwardedFor.split(",")[0]) || normalize(req.headers["x-client-ip"]) || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (record.resetAt <= now) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  record.count += 1;
  rateLimitStore.set(ip, record);

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) rateLimitStore.delete(key);
  }

  return record.count > RATE_LIMIT_MAX_REQUESTS;
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;

  const formData = new URLSearchParams();
  formData.set("secret", secret);
  formData.set("response", token);
  if (ip !== "unknown") formData.set("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
  });

  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
}

function validatePayload(payload) {
  const email = normalize(payload.email);
  const message = normalize(payload.message);

  if (normalize(payload._gotcha)) return "Your request could not be submitted.";
  if (!email || email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) return "Please enter a valid email address.";
  if (!message) return "Please include a short message.";
  if (message.length > MAX_MESSAGE_LENGTH) return `Please keep the message under ${MAX_MESSAGE_LENGTH} characters.`;
  if (countUrls(message) > MAX_ALLOWED_URLS) return "Please remove extra links from your message.";
  return "";
}

function buildEmail(payload) {
  const fields = [
    ["Name", payload.name],
    ["Organization", payload.organization],
    ["Email", payload.email],
    ["Event Date", payload.eventDate],
    ["Event Location", payload.eventLocation],
    ["Audience Size", payload.audienceSize],
    ["Format", payload.format],
    ["Budget Range", payload.budget],
    ["Inquiry Type", payload.inquiryType],
    ["Recording Plans", payload.recordingPlans]
  ];

  return [
    ...fields.map(([label, value]) => `${label}: ${normalize(value)}`),
    "",
    "Message:",
    normalize(payload.message)
  ].join("\n");
}

async function sendEmail(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    throw new Error("Contact email delivery is not configured.");
  }

  const organization = normalize(payload.organization) || "Event Inquiry";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: normalize(payload.email),
      subject: `Booking Request - ${organization}`,
      text: buildEmail(payload)
    })
  });

  if (!response.ok) {
    throw new Error("Contact email delivery failed.");
  }
}

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = json(405, { message: "Method not allowed." });
    return;
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    context.res = json(429, { message: "Too many requests. Please try again later." });
    return;
  }

  const payload = req.body || {};
  const validationError = validatePayload(payload);
  if (validationError) {
    context.res = json(400, { message: validationError });
    return;
  }

  const turnstileOk = await verifyTurnstile(normalize(payload.turnstileToken), ip);
  if (!turnstileOk) {
    context.res = json(400, { message: "Please complete the verification challenge." });
    return;
  }

  try {
    await sendEmail(payload);
    context.res = json(200, { ok: true });
  } catch (error) {
    context.log.error(error.message);
    context.res = json(500, { message: "Your request could not be submitted. Please try again later." });
  }
};
