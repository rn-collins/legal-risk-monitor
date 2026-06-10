export const config = { runtime: "edge" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS });

  let email;
  try {
    const body = await req.json();
    email = (body.email || "").trim().toLowerCase();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: CORS });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email address" }), { status: 400, headers: CORS });
  }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
  const SLACK_URL = process.env.SLACK_WEBHOOK_URL;
  const RESEND_KEY = process.env.RESEND_API_KEY;

  const results = await Promise.allSettled([

    // 1 — Check for duplicate + store in Upstash Redis
    (async () => {
      // Check master dedup set
      const dedupRes = await fetch(`${UPSTASH_URL}/sismember/leads:all_emails/${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const dedupData = await dedupRes.json();
      if (dedupData.result === 1) return { duplicate: true };

      // Add to master dedup set
      await fetch(`${UPSTASH_URL}/sadd/leads:all_emails/${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });

      // Add to product-specific subscriber list
      await fetch(`${UPSTASH_URL}/sadd/subscribers:legal-risk-monitor/${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });

      // Store lead record with timestamp
      const timestamp = Date.now();
      await fetch(`${UPSTASH_URL}/set/leads:legal-risk-monitor:${timestamp}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "legal-risk-monitor", subscribedAt: new Date().toISOString() }),
      });

      return { stored: true };
    })(),

    // 2 — Slack alert
    fetch(SLACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🔔 *New subscriber — Startup Legal Risk Monitor*\n*Email:* ${email}\n*Source:* legal-risk-monitor.vercel.app\n*Time:* ${new Date().toLocaleString("en-US", { timeZone: "Pacific/Honolulu" })} HST`,
      }),
    }),

    // 3 — Resend confirmation email to subscriber
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: email,
        subject: "You're subscribed — Startup Legal Risk Monitor",
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; background: #F7F9F8;">
            <div style="background: #085041; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <p style="font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin: 0 0 6px;">Aloha AI Consulting</p>
              <h1 style="font-size: 20px; color: #ffffff; margin: 0; font-weight: 600;">Startup Legal Risk Monitor</h1>
            </div>
            <div style="background: #ffffff; border-radius: 8px; padding: 28px; border: 1px solid #D9E8E5;">
              <p style="font-size: 15px; color: #1C1B1F; margin: 0 0 16px;">You're subscribed.</p>
              <p style="font-size: 14px; color: #4A5568; line-height: 1.6; margin: 0 0 16px;">
                Every Monday morning you'll receive a curated briefing of the week's most important regulatory signals for startup founders — SEC enforcement actions, FTC guidance, CFPB updates, and AI governance bills advancing through Congress.
              </p>
              <p style="font-size: 14px; color: #4A5568; line-height: 1.6; margin: 0 0 24px;">
                Risk tiers: <strong>IMMEDIATE</strong> (act now) · <strong>WATCH</strong> (monitor closely) · <strong>INFO</strong> (awareness only).
              </p>
              <a href="https://legal-risk-monitor.vercel.app" style="display: inline-block; background: #1B7A68; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500;">View the live dashboard</a>
            </div>
            <p style="font-size: 11px; color: #9CA3AF; margin-top: 20px; text-align: center;">
              Built by RN Collins · Aloha AI Consulting · Honolulu, HI<br>
              <a href="https://linkedin.com/in/rn-collins" style="color: #1B7A68;">linkedin.com/in/rn-collins</a>
            </p>
          </div>
        `,
      }),
    }),

  ]);

  const [redisResult] = results;
  const isDuplicate = redisResult.status === "fulfilled" && redisResult.value?.duplicate;

  return new Response(
    JSON.stringify({
      success: true,
      duplicate: isDuplicate,
      message: isDuplicate ? "Already subscribed." : "Subscribed successfully.",
    }),
    { status: 200, headers: CORS }
  );
}
