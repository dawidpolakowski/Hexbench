/* global module */
// Pure note-body text helpers, shared by the main window and the standalone
// sticky-note window. Loaded as a plain script before renderer.js/note.js so
// these names are available globally in the browser, and required directly
// from Node tests.

function noteLines(body) {
  return (body || "").split("\n").map((l) => l.trim()).filter(Boolean);
}

// Plain-text form of a note (used by Copy buttons).
function noteToText(note) {
  if (!note) return "";
  if (note.type !== "list") return note.body || "";
  return noteLines(note.body)
    .map((l, i) => (note.listStyle === "number" ? `${i + 1}. ${l}` : `• ${l}`))
    .join("\n");
}

// One-line preview for note cards/list rows.
function notePreview(note) {
  if (note.type === "list") {
    const lines = noteLines(note.body);
    if (!lines.length) return "Empty list";
    return lines.map((l, i) => (note.listStyle === "number" ? `${i + 1}. ${l}` : `• ${l}`)).join("   ");
  }
  return note.body.replace(/\s+/g, " ").trim() || "Empty note";
}

if (typeof module !== "undefined") {
  module.exports = { noteLines, noteToText, notePreview };
}
