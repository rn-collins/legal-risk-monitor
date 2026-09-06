import test from"node:test";import assert from"node:assert/strict";import{readFile}from"node:fs/promises";import{spawnSync}from"node:child_process";import{records}from"../api/signals.js";import{esc}from"../public/card.mjs";import handler from"../api/signals.js";test("signal schema is bounded and current",async()=>{const r=handler(new Request("https://x.test/api/signals"));assert.equal(r.status,200);const d=await r.json();assert.equal(d.records.length,5);assert.equal(d.verifiedOn,"2026-08-19");for(const x of d.records){assert.ok(x.sourceType);assert.ok(x.authorityLevel);assert.ok(x.boundary);assert.ok(x.checkedOn);assert.ok(x.nextReview);assert.match(x.url,/^https:\/\//)}});test("writes rejected",()=>assert.equal(handler(new Request("https://x.test/api/signals",{method:"POST"})).status,405));

// The register is rendered into index.html at build time from api/signals.js.
// These two guard the join: that the shipped HTML actually carries every
// record, and that it has not drifted from the data behind it. Without the
// second, editing a record would leave the served page quietly stale — which
// is the failure that put an empty container on this site to begin with.
test("every record is server-rendered into the page", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf-8");
  const body = html.slice(html.indexOf("<!--records-->"), html.indexOf("<!--/records-->"));
  assert.equal(body.match(/<article class="card"/g).length, records.length);
  for (const x of records) {
    assert.ok(body.includes(esc(x.title)), `missing title: ${x.title}`);
    assert.ok(body.includes(esc(x.boundary)), `missing boundary for ${x.id}`);
    assert.ok(body.includes(esc(x.suggestion)), `missing suggestion for ${x.id}`);
  }
  assert.ok(!body.includes("<button"), "build-time cards must not ship inert controls");
});

test("committed index.html is current with the data", () => {
  const r = spawnSync(process.execPath, ["scripts/render.mjs", "--check"],
    { cwd: new URL("..", import.meta.url), encoding: "utf-8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});
