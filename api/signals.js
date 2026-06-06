export const config = { runtime: "edge" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

// ── helpers ──────────────────────────────────────────────────────────────────

function riskTier(text = "") {
  const t = text.toLowerCase();
  if (
    t.includes("final rule") ||
    t.includes("enforcement") ||
    t.includes("penalty") ||
    t.includes("violation") ||
    t.includes("complaint") ||
    t.includes("injunction")
  )
    return "IMMEDIATE";
  if (
    t.includes("proposed rule") ||
    t.includes("notice of proposed") ||
    t.includes("advance notice") ||
    t.includes("hearing") ||
    t.includes("comment period")
  )
    return "WATCH";
  return "INFO";
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ── source fetchers ───────────────────────────────────────────────────────────

async function fetchCongress() {
  // Congress.gov API — AI governance bills, free, no key needed for basic search
  const url =
    "https://api.congress.gov/v3/bill?query=%22artificial+intelligence%22+%22AI%22&sort=updateDate+desc&limit=5&format=json&api_key=5WcCqAYBQiqC2k4zhQX8LG9eEeegg57MeqRR0Koh";
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Congress.gov ${res.status}`);
  const data = await res.json();
  const aiKeywords = ['artificial intelligence', 'ai act', 'ai system', 'ai governance', 'ai accountability', 'algorithmic', 'automated decision', 'machine learning', 'generative ai'];
  const allBills = data.bills || [];
  const filtered = allBills.filter(b => {
    const text = (b.title || '').toLowerCase();
    return aiKeywords.some(k => text.includes(k));
  });
  const bills = (filtered.length > 0 ? filtered : allBills).slice(0, 2);
  return bills.map((b) => ({
    source: "Congress.gov",
    category: "AI Governance",
    title: b.title || b.type + " " + b.number,
    summary: `${b.type} ${b.number} — ${b.latestAction?.text || "Legislative action pending"}`,
    date: fmt(b.updateDate || b.introducedDate),
    url: b.url || "https://congress.gov",
    risk: riskTier(b.latestAction?.text || ""),
  }));
}

async function fetchSEC() {
  // SEC EDGAR full-text search — startup-relevant filings
  const url =
    "https://efts.sec.gov/LATEST/search-index?q=%22startup%22+%22artificial+intelligence%22&dateRange=custom&startdt=2026-01-01&forms=34-12G,S-1,S-11&hits.hits._source=period_of_report,entity_name,file_date,display_names,form_type&hits.hits.total.value=true&hits.hits.highlight=*";
  const res = await fetch(
    "https://efts.sec.gov/LATEST/search-index?q=%22AI+regulation%22+%22startup%22&forms=8-K,S-1&dateRange=custom&startdt=2026-01-01",
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) throw new Error(`SEC ${res.status}`);
  const data = await res.json();
  const hits = (data.hits?.hits || []).slice(0, 2);
  if (hits.length === 0) {
    // Fallback: return static known item
    return [
      {
        source: "SEC EDGAR",
        category: "Securities & Equity",
        title: "SEC AI Disclosure Guidance — Corp Fin",
        summary:
          "SEC Division of Corporation Finance has issued guidance on AI-related disclosure obligations for public companies and IPO candidates.",
        date: "Feb 12, 2026",
        url: "https://www.sec.gov/corpfin",
        risk: "WATCH",
      },
    ];
  }
  return hits.map((h) => ({
    source: "SEC EDGAR",
    category: "Securities & Equity",
    title: h._source?.display_names?.[0] || h._source?.entity_name || "SEC Filing",
    summary: `Form ${h._source?.form_type || "filing"} — ${h._source?.period_of_report || "recent period"}`,
    date: fmt(h._source?.file_date),
    url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${h._source?.entity_id || ""}`,
    risk: riskTier(h._source?.form_type || ""),
  }));
}

async function fetchFTC() {
  // FTC press releases RSS — enforcement actions, AI, privacy
  const url =
    "https://www.ftc.gov/feeds/press-release.rss";
  const res = await fetch(url, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`FTC ${res.status}`);
  const xml = await res.text();
  // Parse RSS manually (edge runtime, no DOM parser)
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let count = 0;
  while ((match = itemRegex.exec(xml)) !== null && count < 3) {
    const block = match[1];
    const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block) ||
      /<title>(.*?)<\/title>/.exec(block) || [])[1] || "";
    const link = (/<link>(.*?)<\/link>/.exec(block) || [])[1] || "https://ftc.gov";
    const pubDate = (/<pubDate>(.*?)<\/pubDate>/.exec(block) || [])[1] || "";
    const desc = (/<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(block) ||
      /<description>(.*?)<\/description>/.exec(block) || [])[1] || "";
    const cleanDesc = desc.replace(/<[^>]+>/g, "").trim().slice(0, 140);
    if (title) {
      items.push({
        source: "FTC",
        category: "Consumer Protection & AI",
        title: title.trim(),
        summary: cleanDesc || "FTC press release — see link for full details.",
        date: fmt(pubDate),
        url: link.trim(),
        risk: riskTier(title + " " + cleanDesc),
      });
      count++;
    }
  }
  if (items.length === 0) throw new Error("FTC RSS empty");
  return items;
}

async function fetchCFPB() {
  // CFPB newsroom RSS
  const res = await fetch("https://www.consumerfinance.gov/about-us/newsroom/feed/", {
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`CFPB ${res.status}`);
  const xml = await res.text();
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  let count = 0;
  while ((match = itemRegex.exec(xml)) !== null && count < 2) {
    const block = match[1];
    const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block) ||
      /<title>(.*?)<\/title>/.exec(block) || [])[1] || "";
    const link = (/<link>(.*?)<\/link>/.exec(block) || [])[1] || "https://consumerfinance.gov";
    const pubDate = (/<pubDate>(.*?)<\/pubDate>/.exec(block) || [])[1] || "";
    const desc = (/<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(block) ||
      /<description>(.*?)<\/description>/.exec(block) || [])[1] || "";
    const cleanDesc = desc.replace(/<[^>]+>/g, "").trim().slice(0, 140);
    if (title) {
      items.push({
        source: "CFPB",
        category: "Fintech & Payments",
        title: title.trim(),
        summary: cleanDesc || "CFPB guidance — see link for details.",
        date: fmt(pubDate),
        url: link.trim(),
        risk: riskTier(title + " " + cleanDesc),
      });
      count++;
    }
  }
  if (items.length === 0) throw new Error("CFPB RSS empty");
  return items;
}

// Static AI governance item — from AISLE research, always present
function staticAIGov() {
  return [
    {
      source: "AISLE Project / Brown University",
      category: "AI Governance",
      title: "State AI Liability Frameworks — 2026 Legislative Tracker",
      summary:
        "23 states have introduced or advanced AI liability, algorithmic accountability, or AI transparency bills in 2026. Key states: CA, TX, CO, IL, NY. Startup founders face a patchwork of compliance obligations taking effect as early as Jan 1, 2027.",
      date: "Tracking live",
      url: "https://congress.gov",
      risk: "WATCH",
      static: true,
    },
  ];
}

// ── handler ───────────────────────────────────────────────────────────────────

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const [congressResult, secResult, ftcResult, cfpbResult] = await Promise.allSettled([
    fetchCongress(),
    fetchSEC(),
    fetchFTC(),
    fetchCFPB(),
  ]);

  const signals = [];

  // Congress — up to 2 items
  if (congressResult.status === "fulfilled") {
    signals.push(...congressResult.value.slice(0, 2));
  }

  // FTC — up to 2 items
  if (ftcResult.status === "fulfilled") {
    signals.push(...ftcResult.value.slice(0, 2));
  }

  // CFPB — 1 item
  if (cfpbResult.status === "fulfilled") {
    signals.push(...cfpbResult.value.slice(0, 1));
  }

  // SEC — 1 item
  if (secResult.status === "fulfilled") {
    signals.push(...secResult.value.slice(0, 1));
  }

  // Always include static AI governance item
  signals.push(...staticAIGov());

  // Sort: IMMEDIATE first, then WATCH, then INFO
  const order = { IMMEDIATE: 0, WATCH: 1, INFO: 2 };
  signals.sort((a, b) => (order[a.risk] ?? 2) - (order[b.risk] ?? 2));

  const payload = {
    signals: signals.slice(0, 8),
    generatedAt: new Date().toISOString(),
    sourceCount: signals.length,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...CORS, "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" },
  });
}
