const { test } = require("node:test");
const assert = require("node:assert/strict");
const { relTime, typeIcon } = require("../src/renderer/textFormat");

test("relTime buckets by seconds/minutes/hours/days", () => {
  const now = Date.now();
  assert.equal(relTime(now), "just now");
  assert.equal(relTime(now - 90 * 1000), "1m ago");
  assert.equal(relTime(now - 2 * 3600 * 1000), "2h ago");
  assert.equal(relTime(now - 2 * 86400 * 1000), "2d ago");
});

test("typeIcon maps known types, defaulting for plain text", () => {
  assert.equal(typeIcon("link"), "🔗");
  assert.equal(typeIcon("code"), "⌥");
  assert.equal(typeIcon("text"), "⌨");
  assert.equal(typeIcon("unknown"), "⌨");
});
