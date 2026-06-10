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
      summary: "Establishes voluntary AI standards, metrics, evaluation tools, testbeds, and research infrastructure. Codifies the renamed Center for AI Standards and Innovation (CAISI) at NIST, authorizes AI testbeds at national labs, and expands access to public datasets for AI research. Startup founders benefit from potential NAIRR access and federally-supported AI testing infrastructure.",
      date: "Feb 2026",
      url: "https://www.congress.gov/bill/119th-congress/senate-bill/3952",
      risk: "WATCH",
    },
    {
      source: "Congress.gov",
      category: "AI Governance",
      title: "American AI Leadership & Uniformity Act (H.R. 5388)",
      summary: "Establishes a 5-year temporary moratorium on state laws restricting AI models and systems in interstate commerce. Directly affects startup founders navigating the patchwork of CO, IL, TX, and NY state AI regulations — if enacted, would suspend new state mandates during the moratorium period while Congress develops a national framework.",
      date: "2025",
      url: "https://www.congress.gov/bill/119th-congress/house-bill/5388",
      risk: "WATCH",
    },
    {
      source: "Congress.gov",
      category: "AI Governance · Fintech",
      title: "Unleashing AI Innovation in Financial Services Act (H.R. 4801)",
      summary: "Directs the Fed, FDIC, OCC, SEC, CFPB, NCUA, and FHFA to establish AI Innovation Labs allowing regulated financial entities to test AI projects without enforcement risk. Relevant to fintech startups that are already supervised by federal financial regulators — unregulated early-stage startups are not directly eligible but the bill signals regulatory posture toward AI in financial services.",
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
      summary: "Directs Treasury, Homeland Security, and Commerce to develop a federal strategy against AI-enabled financial crimes and report to Congress annually. Imposes no direct compliance obligations on private companies — signals federal regulatory direction on AI-enabled fraud and may inform future AML and payments compliance frameworks.",
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
      summary: "SEC has brought multiple enforcement actions against companies that misrepresented AI capabilities to investors (including Joonko, 2023; Ideanomics; COVA Smart Home, 2024). Startup founders raising capital must ensure pitch materials, investor decks, and offering documents accurately describe the current state — not aspirational capabilities — of AI product development.",
      date: "2023–2026",
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
      summary: "FTC charged Rytr in September 2024 for enabling AI-generated fake reviews at scale. Initial consent order banned the service; the FTC set aside the order in December 2025 in response to the Trump Administration AI Action Plan. Founders using AI to generate testimonials or reviews should note: the FTC retains authority to bring new enforcement actions for AI-enabled consumer deception under Section 5.",
      date: "Sep 2024 / Dec 2025",
      url: "https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes",
      risk: "IMMEDIATE",
    },
    {
      source: "FTC",
      category: "Consumer Protection & AI",
      title: "FTC AI Accountability Report — Commercial Surveillance & Algorithmic Harms",
      summary: "FTC issued guidance warning that AI-enabled commercial surveillance, opaque algorithmic decision-making, and biometric data collection are priority enforcement areas. Startup founders using behavioral data, recommendation algorithms, or AI-driven personalization should review data practices against FTC's stated enforcement priorities.",
      date: "2025",
      url: "https://www.ftc.gov/business-guidance/blog/2024/09/operation-ai-comply-continuing-crackdown-overpromises-ai-related-lies",
      risk: "WATCH",
    },
    {
      source: "FTC",
      category: "Consumer Protection & AI · Privacy",
      title: "FTC Section 5 — AI Deception & Unfair Practices Enforcement Expansion",
      summary: "FTC has expanded application of Section 5 unfairness doctrine to AI-enabled practices including undisclosed AI use in consumer interactions, AI-generated impersonation, and automated dark patterns. Any startup using AI in customer-facing products should audit for compliance with FTC's expanded AI enforcement framework.",
      date: "2025-2026",
      url: "https://www.ftc.gov/industry/technology/artificial-intelligence",
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
        "23+ states have introduced or advanced AI liability, algorithmic accountability, or AI transparency bills in 2026. Key states: CA, TX, CO, IL, NY. Colorado SB 189 (replacement AI law) takes effect Jan 1, 2027. Startup founders face a growing patchwork of state AI compliance obligations — no two states's frameworks are identical.",
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
