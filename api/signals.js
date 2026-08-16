export const config = { runtime: "edge" };
const signals = [
  { id:"sec-ai", authority:"SEC", authorityType:"Enforcement action", status:"official", priority:"review-now", title:"Substantiate AI claims made to investors", verifiedOn:"2026-08-16", sourceUrl:"https://www.sec.gov/newsroom/press-releases/2024-167" },
  { id:"ftc-ai", authority:"FTC", authorityType:"Enforcement complaint", status:"official", priority:"review-now", title:"Test AI marketing claims before launch", verifiedOn:"2026-08-16", sourceUrl:"https://www.ftc.gov/news-events/news/press-releases/2025/08/ftc-sues-stop-air-ai-using-deceptive-claims-about-business-growth-earnings-potential-refund" },
  { id:"nist-rmf", authority:"NIST", authorityType:"Voluntary framework", status:"official", priority:"baseline", title:"Create an AI risk management operating loop", verifiedOn:"2026-08-16", sourceUrl:"https://www.nist.gov/itl/ai-risk-management-framework" },
  { id:"create-ai", authority:"Congress.gov", authorityType:"Proposed legislation", status:"introduced-not-law", priority:"monitor", title:"Track CREATE AI Act without treating it as law", verifiedOn:"2026-08-16", sourceUrl:"https://www.congress.gov/bill/119th-congress/house-bill/2385" },
  { id:"regcf", authority:"SEC", authorityType:"Compliance guidance", status:"official", priority:"monitor", title:"Choose a valid securities exemption before fundraising", verifiedOn:"2026-08-16", sourceUrl:"https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/exempt-offerings" }
];
export default function handler(req) {
  if (req.method !== "GET") return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{"content-type":"application/json","allow":"GET"}});
  return new Response(JSON.stringify({signals,methodology:"Primary authorities; manually verified; no automated legal conclusions.",verifiedOn:"2026-08-16",count:signals.length}),{headers:{"content-type":"application/json","cache-control":"public, s-maxage=86400, stale-while-revalidate=604800"}});
}
