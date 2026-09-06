# Founder Legal Radar

A five-record, source-linked U.S. startup-law issue-spotting workspace. It is deliberately bounded and is not legal advice.

## Build

`api/signals.js` is the single source of truth for the five records. `npm run build`
renders them through `public/card.mjs` into the register on `/` and the citation
table on `/sources`, then validates the file manifest, CSP, and routing.

The rendered output is committed. It has to be: the register is the substance of
this site, and when it existed only as a runtime `fetch` the served HTML carried
130 visible words and an empty container — invisible to crawlers, to reader mode,
and to anyone whose request for `/api/signals` failed. JavaScript now enhances the
page (filtering, saving, export) instead of constituting it.

Run `npm test` and `npm run build` before deployment. `node scripts/render.mjs --check`
fails if the committed HTML has drifted from the data, and the test suite runs it.
