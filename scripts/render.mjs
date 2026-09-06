// Renders the signal records into public/index.html at build time.
//
// The register is the substance of this site, and it used to exist only as a
// runtime fetch: the served HTML carried 130 visible words and an empty
// container, so a crawler, a reader-mode pane, or anyone whose fetch failed
// got a page that said "Loading records…" and nothing else.
//
// api/signals.js stays the single source of truth. This script reads it,
// renders it through the same template the browser uses (public/card.mjs),
// and writes the result between the markers in index.html. The output is
// committed so it ships even if a host skips the build, and
// test/site.test.mjs fails if the committed HTML drifts from the data.
//
// Run: node scripts/render.mjs        (or `npm run build`)
//      node scripts/render.mjs --check   exit 1 if index.html is stale

import { readFile, writeFile } from "node:fs/promises";
import { records } from "../api/signals.js";
import { cardHTML, esc, safeUrl } from "../public/card.mjs";

const root = new URL("..", import.meta.url);
const page = new URL("public/index.html", root);
const sourcesPage = new URL("public/sources.html", root);
const SOURCELIST = /(<!--sourcelist-->)[\s\S]*?(<!--\/sourcelist-->)/;
const MARKERS = /(<!--records-->)[\s\S]*?(<!--\/records-->)/;
const STATUS = /(<p id="statusText"[^>]*>)[\s\S]*?(<\/p>)/;

const cards = records.map(x => cardHTML(x, null)).join("");
// The count is stated rather than implied: the site's own scope line promises
// five selected records, and a reader should be able to check that claim
// against the page without counting cards.
const line = `${records.length} of ${records.length} records shown. `
  + `Filtering, saving, and export need JavaScript; the full register is below either way.`;

// /sources shows the same five records as a citation table. It is generated
// rather than typed so the method page cannot drift from the register it
// describes — the page claims exactly that, so it has to be true.
const table = `<div class="tablewrap"><table class="srcs">`
  + `<caption>Every record in the corpus, with its document type and check date.</caption>`
  + `<thead><tr><th scope="col">Record</th><th scope="col">Document type</th>`
  + `<th scope="col">Authority</th><th scope="col">Jurisdiction</th>`
  + `<th scope="col">Source date</th><th scope="col">Checked</th></tr></thead><tbody>`
  + records.map(x =>
      `<tr><th scope="row"><a href="${esc(safeUrl(x.url))}" rel="noopener">${esc(x.title)}</a>`
      + (x.underlyingUrl
          ? ` <a class="sub" href="${esc(safeUrl(x.underlyingUrl))}" rel="noopener">(underlying document)</a>`
          : "")
      + `</th><td>${esc(x.sourceType)}</td><td>${esc(x.authorityLevel)}</td>`
      + `<td>${esc(x.jurisdiction)}</td><td>${esc(x.sourceDate)}</td>`
      + `<td><time datetime="${esc(x.checkedOn)}">${esc(x.checkedOn)}</time></td></tr>`).join("")
  + `</tbody></table></div>`;

const srcBefore = await readFile(sourcesPage, "utf-8");
if (!SOURCELIST.test(srcBefore)) throw Error("render: source-list markers not found in public/sources.html");
const srcAfter = srcBefore.replace(SOURCELIST, (_, a, b) => `${a}${table}${b}`);

const before = await readFile(page, "utf-8");
for (const [re, name] of [[MARKERS, "record markers"], [STATUS, "#statusText"]]) {
  if (!re.test(before)) throw Error(`render: ${name} not found in public/index.html`);
}
const after = before
  .replace(MARKERS, (_, a, b) => `${a}${cards}${b}`)
  .replace(STATUS, (_, a, b) => `${a}${esc(line)}${b}`);

if (process.argv.includes("--check")) {
  if (after !== before || srcAfter !== srcBefore) {
    console.error("Rendered output is stale — run `npm run build` and commit the result.");
    process.exit(1);
  }
  console.log(`index.html and sources.html are current with ${records.length} records.`);
} else {
  await writeFile(page, after);
  await writeFile(sourcesPage, srcAfter);
  console.log(`Rendered ${records.length} records into index.html (${after.length} b) `
    + `and sources.html (${srcAfter.length} b).`);
}
