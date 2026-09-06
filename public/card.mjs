// One card template, two callers: app.js renders it in the browser with the
// reader's local save/status controls, and scripts/render.mjs renders it at
// build time into index.html so the register is readable before — and without
// — JavaScript.
//
// Keeping it in a single file is the whole point. This page shipped with an
// empty <div id="cards"> and 130 visible words, because the only copy of this
// markup lived inside a script that no crawler, reader-mode, or JS-blocked
// browser ever ran. Two copies of a template drift; one cannot.

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// A record's url/underlyingUrl comes from the data file, but the rule is
// enforced here rather than trusted upstream: anything that is not https is
// rendered inert.
export function safeUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.href : "#";
  } catch {
    return "#";
  }
}

export const STATUSES = [
  ["unreviewed", "Unreviewed"],
  ["watching", "Watching"],
  ["counsel", "Ask counsel"],
  ["closed", "Closed"],
];

function actions(x, view) {
  const st = view.status || "unreviewed";
  const opts = STATUSES.map(([v, label]) =>
    `<option value="${v}"${st === v ? " selected" : ""}>${label}</option>`).join("");
  return `<div class="actions"><button data-save aria-pressed="${String(!!view.saved)}">`
    + `${view.saved ? "Saved" : "Save"} ${esc(x.title)}</button>`
    + `<label>Status for ${esc(x.title)}<select data-status>${opts}</select></label></div>`;
}

/**
 * @param x     one signal record
 * @param view  the reader's local state for it ({saved, status}), or null.
 *              Null means build time: there is no local state on the server,
 *              and a rendered button/select would be inert for a reader
 *              without JS, so the controls are omitted rather than shipped
 *              dead. app.js re-renders each card with them once it loads.
 */
export function cardHTML(x, view) {
  return `<article class="card" data-id="${esc(x.id)}">`
    + `<span class="tag">${esc(x.authorityLevel)}</span>`
    + `<span class="tag">${esc(x.sourceType)}</span>`
    + `<h3>${esc(x.title)}</h3>`
    + `<p>${esc(x.proposition)}</p>`
    + `<p class="boundary"><strong>Boundary:</strong> ${esc(x.boundary)}</p>`
    + `<p class="meta">${esc(x.jurisdiction)} · checked `
    + `<time datetime="${esc(x.checkedOn)}">${esc(x.checkedOn)}</time> · next review `
    + `<time datetime="${esc(x.nextReview)}">${esc(x.nextReview)}</time></p>`
    + `<p><strong>RN workflow suggestion:</strong> ${esc(x.suggestion)}</p>`
    + `<p><a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">Open official source (new tab)</a>`
    + (x.underlyingUrl
        ? ` · <a href="${esc(safeUrl(x.underlyingUrl))}" target="_blank" rel="noopener">Underlying document (new tab)</a>`
        : "")
    + `</p>`
    + (view ? actions(x, view) : "")
    + `</article>`;
}
