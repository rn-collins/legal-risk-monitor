export const config = { runtime: "edge" };

export default async function handler(req) {
  // Security: only allow Vercel cron or requests with correct secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
  const RESEND_KEY = process.env.RESEND_API_KEY;

  // 1 — Get all subscribers
  const subsRes = await fetch(`${UPSTASH_URL}/smembers/subscribers:legal-risk-monitor`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  const subsData = await subsRes.json();
  const subscribers = subsData.result || [];

  if (subscribers.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: "No subscribers" }), { status: 200 });
  }

  // 2 — Fetch current signals
  const signalsRes = await fetch("https://legal-risk-monitor.vercel.app/api/signals");
  const signalsData = await signalsRes.json();
  const signals = signalsData.signals || [];

  // 3 — Build email HTML
  const badgeColor = { IMMEDIATE: "#C53030", WATCH: "#92400E", INFO: "#0A3D33" };
  const badgeBg = { IMMEDIATE: "#FFF5F5", WATCH: "#FFFBEB", INFO: "#E0F5F0" };

  const signalRows = signals.map(s => `
    <div style="background: #ffffff; border: 1px solid #D9E8E5; border-left: 3px solid #1B7A68; border-radius: 6px; padding: 14px 16px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 10px; font-family: monospace; color: #1B7A68; font-weight: 500;">${s.source} · ${s.category}</span>
        <span style="font-size: 9px; font-family: monospace; padding: 2px 8px; border-radius: 3px; background: ${badgeBg[s.risk] || "#E0F5F0"}; color: ${badgeColor[s.risk] || "#0A3D33"}; font-weight: 600;">${s.risk}</span>
      </div>
      <div style="font-size: 14px; font-weight: 600; color: #1C1B1F; margin-bottom: 4px;">${s.title}</div>
      <div style="font-size: 12px; color: #4A5568; line-height: 1.6;">${s.summary}</div>
      ${s.url && s.url !== "#" ? `<a href="${s.url}" style="font-size: 11px; color: #1B7A68; text-decoration: none; display: inline-block; margin-top: 6px;">View source →</a>` : ""}
    </div>
  `).join("");

  const weekStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 16px; background: #F7F9F8;">
      <div style="background: #085041; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <p style="font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin: 0 0 4px; font-family: monospace;">Aloha AI Consulting</p>
        <h1 style="font-size: 20px; color: #ffffff; margin: 0 0 4px; font-weight: 600;">Startup Legal Risk Monitor</h1>
        <p style="font-size: 12px; color: rgba(255,255,255,0.6); margin: 0;">Weekly Briefing · ${weekStr}</p>
      </div>
      <p style="font-size: 13px; color: #4A5568; margin: 0 0 20px; line-height: 1.6;">
        This week's regulatory signals for startup founders — ${signals.length} active items across SEC, FTC, CFPB, Congress, and AI governance.
      </p>
      ${signalRows}
      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #D9E8E5; text-align: center;">
        <a href="https://legal-risk-monitor.vercel.app" style="display: inline-block; background: #1B7A68; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500; margin-bottom: 16px;">View live dashboard</a>
        <p style="font-size: 10px; color: #9CA3AF; margin: 0; line-height: 1.6;">
          Built by RN Collins · Aloha AI Consulting · Honolulu, HI<br>
          <a href="https://linkedin.com/in/rn-collins" style="color: #1B7A68;">linkedin.com/in/rn-collins</a><br>
          Nothing in this email constitutes legal advice.
        </p>
      </div>
    </div>
  `;

  // 4 — Send to all subscribers
  const sends = await Promise.allSettled(
    subscribers.map(email =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: email,
          subject: `Startup Legal Risk Monitor — Weekly Briefing ${weekStr}`,
          html,
        }),
      })
    )
  );

  const sent = sends.filter(r => r.status === "fulfilled").length;
  const failed = sends.length - sent;

  return new Response(
    JSON.stringify({ sent, failed, total: subscribers.length, week: weekStr }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
