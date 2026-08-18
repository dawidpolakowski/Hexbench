/* global module */
// Pure clipboard-item text/time formatting helpers. Loaded as a plain script
// before renderer.js so these names are available globally in the browser,
// and required directly from Node tests.

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

function typeIcon(t) {
  if (t === "link") return "🔗";
  if (t === "code") return "⌥";
  return "⌨";
}

if (typeof module !== "undefined") {
  module.exports = { relTime, typeIcon };
}
