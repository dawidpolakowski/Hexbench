const { test } = require("node:test");
const assert = require("node:assert/strict");
const { noteLines, noteToText, notePreview } = require("../src/renderer/noteText");

test("noteLines trims and drops empty lines", () => {
  assert.deepEqual(noteLines(" a \n\n b\n  \nc "), ["a", "b", "c"]);
  assert.deepEqual(noteLines(""), []);
  assert.deepEqual(noteLines(null), []);
});

test("noteToText returns the body as-is for text notes", () => {
  assert.equal(noteToText({ type: "text", body: "hello" }), "hello");
  assert.equal(noteToText(null), "");
});

test("noteToText formats list notes with bullets or numbers", () => {
  const bullet = { type: "list", listStyle: "bullet", body: "a\nb" };
  assert.equal(noteToText(bullet), "• a\n• b");
  const numbered = { type: "list", listStyle: "number", body: "a\nb" };
  assert.equal(noteToText(numbered), "1. a\n2. b");
});

test("notePreview summarizes list notes on one line, or reports empty", () => {
  assert.equal(notePreview({ type: "list", listStyle: "bullet", body: "a\nb" }), "• a   • b");
  assert.equal(notePreview({ type: "list", listStyle: "bullet", body: "" }), "Empty list");
});

test("notePreview collapses whitespace in text notes, or reports empty", () => {
  assert.equal(notePreview({ type: "text", body: "hello\n  world  " }), "hello world");
  assert.equal(notePreview({ type: "text", body: "   " }), "Empty note");
});
