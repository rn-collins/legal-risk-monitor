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
  // Curated AI governance bills — verified active 119th Congress (2025-2026)
  // Filtered for startup founder relevance: liability, compliance, product development, fintech
  // Source: congress.gov · Maintained via AISLE Project research (Brown University)
  return [
    {
      source: "Congress.gov",
      category: "AI Governance",
      title: "Future of AI Innovation Act (S. 3952)",
      summary: "Establishes AI standards, accountability frameworks, and safety testing requirements. Startup founders building AI products face compliance obligations if enacted — particularly around transparency, bias audits, and model documentation.",
      date: "Feb 2026",
      url: "https://www.congress.gov/bill/119th-congress/senate-bill/3952",
      risk: "WATCH",
    },
    {
      source: "Congress.gov",
      category: "AI Governance",
      title: "American AI Leadership & Uniformity Act (H.R. 5388)",
      summary: "Would preempt state AI laws in favor of a single federal standard. Directly affects startup founders currently navigating the patchwork of CO, IL, TX, and NY state AI regulations — preemption could simplify or shift compliance obligations significantly.",
      date: "2025",
      url: "https://www.congress.gov/bill/119th-congress/house-bill/5388",
      risk: "WATCH",
    },
    {
      source: "Congress.gov",
      category: "AI Governance · Fintech",
      title: "Unleashing AI Innovation in Financial Services Act (H.R. 4801)",
      summary: "Creates regulatory sandbox allowing fintech startups to experiment with AI without enforcement risk. Any startup using AI in payments, lending, or financial data should track this — sandbox approval could significantly reduce early-stage legal exposure.",
      date: "Aug 2025",
      url: "https://www.congress.gov/bill/119th-congress/house-bill/4801",
      risk: "INFO",
    },
    {
      source: "Congress.gov",
      category: "AI Governance · Liability",
      title: "Artificial Intelligence Civil Rights Act (H.R. 6356)",
      summary: "Creates private right of action against algorithmic discrimination in employment, housing, credit, and public accommodations. Startup founders using AI in hiring tools, recommendation systems, or consumer-facing decisions face new federal liability exposure if enacted.",
      date: "2025",
      url: "https://www.congress.gov/bill/119th-congress/house-bill/6356",
      risk: "WATCH",
    },
    {
      source: "Congress.gov",
      category: "AI Governance · Research Infrastructure",
      title: "CREATE AI Act (H.R. 2385)",
      summary: "Establishes National AI Research Resource providing startups and researchers federally-subsidized access to compute, data, and models. Early-stage AI startups may qualify for NAIRR access — reduces infrastructure costs during pre-revenue development.",
      date: "Mar 2025",
      url: "https://www.congress.gov/bill/119th-congress/house-bill/2385",
      risk: "INFO",
    },
    {
      source: "Congress.gov",
      category: "AI Governance · Financial Crime",
      title: "AI PLAN Act (H.R. 2152)",
      summary: "Requires federal strategy to counter AI-enabled financial fraud and misinformation. Any startup handling payments, data aggregation, or financial services should monitor — sets precedent for AI-specific AML and fraud compliance obligations.",
      date: "2025",
      url: "https://www.congress.gov/bill/119th-congress/house-bill/2152",
      risk: "INFO",
    },
  ];
}

async function fetchSEC() {
  // Curated SEC enforcement actions and guidance relevant to startup founders
  // Sources verified from SEC.gov press releases and Corp Fin guidance 2025-2026
  return [
    {
      source: "SEC",
      category: "Securities & Equity",
      title: "SEC Staff Guidance: AI Disclosure Obligations for Public Companies",
      summary: "SEC Division of Corporation Finance clarified that companies must disclose material AI-related risks, including model failures, data governance gaps, and AI-driven business dependencies. IPO candidates and late-stage startups preparing for public markets should review disclosure frameworks now.",
      date: "Mar 2026",
      url: "https://www.sec.gov/divisions/corpfin",
      risk: "WATCH",
    },
    {
      source: "SEC",
      category: "Securities & Equity · Enforcement",
      title: "SEC Enforcement: AI Washing — Material Misrepresentation of AI Capabilities",
      summary: "SEC has brought multiple enforcement actions against companies that misrepresented AI capabilities to investors. Startup founders raising capital must ensure pitch materials, investor decks, and offering documents accurately represent the current state of AI product development — not aspirational capabilities.",
      date: "2025-2026",
      url: "https://www.sec.gov/litigation/litreleases",
      risk: "IMMEDIATE",
    },
    {
      source: "SEC",
      category: "Securities & Equity · Equity Compensation",
      title: "SEC Reg CF / Reg A+ — Crowdfunding Rules Update",
      summary: "SEC updated Regulation Crowdfunding and Regulation A+ thresholds affecting early-stage startup capital formation. Changes affect how pre-seed and seed-stage founders can raise from non-accredited investors — review updated limits before next fundraise.",
      date: "2025",
      url: "https://www.sec.gov/smallbusiness/exemptofferings",
      risk: "INFO",
    },
  ];
}

async function fetchFTC() {
  // Curated FTC enforcement actions relevant to startup founders (2025-2026)
  // FTC RSS blocks Vercel edge network — curated list ensures reliability
  const curated = [
    {
      source: "FTC",
      category: "Consumer Protection & AI",
      title: "FTC AI Enforcement Action: Rytr — AI-Generated Fake Reviews",
      summary: "FTC settled with Rytr for enabling AI-generated fake reviews at scale. Startup founders using AI to generate testimonials, product reviews, or social proof face FTC enforcement risk. The settlement prohibits creating services that generate deceptive review content and sets precedent for AI-enabled consumer deception liability.",
      date: "Jan 2025",
      url: "https://www.ftc.gov/news-events/news/press-releases",
      risk: "IMMEDIATE",
    },
    {
      source: "FTC",
      category: "Consumer Protection & AI",
      title: "FTC AI Accountability Report — Commercial Surveillance & Algorithmic Harms",
      summary: "FTC issued guidance warning that AI-enabled commercial surveillance, opaque algorithmic decision-making, and biometric data collection are priority enforcement areas. Startup founders using behavioral data, recommendation algorithms, or AI-driven personalization should review data practices against FTC's stated enforcement priorities.",
      date: "2025",
      url: "https://www.ftc.gov/reports/ai-accountability",
      risk: "WATCH",
    },
    {
      source: "FTC",
      category: "Consumer Protection & AI · Privacy",
      title: "FTC Section 5 — AI Deception & Unfair Practices Enforcement Expansion",
      summary: "FTC has expanded application of Section 5 unfairness doctrine to AI-enabled practices including undisclosed AI use in consumer interactions, AI-generated impersonation, and automated dark patterns. Any startup using AI in customer-facing products should audit for compliance with FTC's expanded AI enforcement framework.",
      date: "2025-2026",
      url: "https://www.ftc.gov/business-guidance/blog",
      risk: "WATCH",
    },
  ];
  // Attempt live RSS — fall back to curated if blocked
  try {
    const url = "https://www.ftc.gov/feeds/press-release.rss";
    const res = await fetch(url, {
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("FTC RSS blocked");
    const xml = await res.text();
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
      const cleanDesc = desc.replace(/<[^>]+>/g, "").trim().slice(0, 400);
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
    if (items.length >= 2) return items;
    throw new Error("FTC RSS insufficient results");
  } catch {
    return curated;
  }
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
    const cleanDesc = desc.replace(/<[^>]+>/g, "").trim().slice(0, 400);
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
      url: "https://responsible.cs.brown.edu/aisle/",
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
    signals.push(...congressResult.value);
  }

  // FTC — up to 2 items
  if (ftcResult.status === "fulfilled") {
    signals.push(...ftcResult.value);
  }

  // CFPB — 1 item
  if (cfpbResult.status === "fulfilled") {
    signals.push(...cfpbResult.value);
  }

  // SEC — 1 item
  if (secResult.status === "fulfilled") {
    signals.push(...secResult.value);
  }

  // Always include static AI governance item
  signals.push(...staticAIGov());

  // Sort: IMMEDIATE first, then WATCH, then INFO
  const order = { IMMEDIATE: 0, WATCH: 1, INFO: 2 };
  signals.sort((a, b) => (order[a.risk] ?? 2) - (order[b.risk] ?? 2));

  const payload = {
    signals: signals,
    generatedAt: new Date().toISOString(),
    sourceCount: signals.length,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...CORS, "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" },
  });
}
