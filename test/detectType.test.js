const { test } = require("node:test");
const assert = require("node:assert/strict");
const { detectType } = require("../src/utils/detectType");

test("detects http/https links", () => {
  assert.equal(detectType("https://example.com"), "link");
  assert.equal(detectType("http://example.com/path?x=1"), "link");
  assert.equal(detectType("  https://example.com  "), "link");
});

test("detects code by punctuation", () => {
  assert.equal(detectType("const x = { a: [1, 2]; };"), "code");
  assert.equal(detectType("array[0]"), "code");
});

test("detects code by leading keyword", () => {
  assert.equal(detectType("function foo() {}"), "code");
  assert.equal(detectType("import x from 'y'"), "code");
  assert.equal(detectType("def foo():"), "code");
  assert.equal(detectType("class Foo:"), "code");
});

test("falls back to plain text", () => {
  assert.equal(detectType("just a normal sentence"), "text");
  assert.equal(detectType("ftp://not-http-so-not-a-link"), "text");
});
