const { test } = require("node:test");
const assert = require("node:assert/strict");
const { HEX_W, hexPoints, snapHex, computeHoneycombLayout } = require("../src/renderer/hexLayout");

function close(actual, expected, msg) {
  assert.ok(Math.abs(actual - expected) < 0.05, `${msg}: expected ${expected}, got ${actual}`);
}

test("hexPoints returns 6 comma-separated coordinate pairs", () => {
  const pts = hexPoints(0, 0, 50).split(" ");
  assert.equal(pts.length, 6);
  const [x, y] = pts[0].split(",").map(Number);
  close(x, 43.3, "first point x");
  close(y, -25.0, "first point y");
});

test("snapHex snaps to the nearest honeycomb slot, offsetting odd rows", () => {
  const snapped = snapHex(90, 80);
  close(snapped.x, 53.3, "snapped x");
  close(snapped.y, 85, "snapped y");
});

test("computeHoneycombLayout flows unmoved items row by row with a row offset", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  const { positions, height } = computeHoneycombLayout(items, 4 * HEX_W); // 3 cols
  const byId = Object.fromEntries(positions.map((p) => [p.id, p]));

  close(byId[1].x, 10, "item1 x"); close(byId[1].y, 10, "item1 y");
  close(byId[2].x, 96.6, "item2 x"); close(byId[2].y, 10, "item2 y");
  close(byId[3].x, 183.2, "item3 x"); close(byId[3].y, 10, "item3 y");
  // 4th item wraps to row 1, which is offset by half a hex width.
  close(byId[4].x, 53.3, "item4 x"); close(byId[4].y, 85, "item4 y");
  positions.forEach((p) => assert.equal(p.moved, false));
  close(height, 195, "grid height");
});

test("computeHoneycombLayout keeps a dragged item at its custom position", () => {
  const items = [{ id: 1, hx: 500, hy: 400 }, { id: 2 }];
  const { positions } = computeHoneycombLayout(items, 4 * HEX_W);
  const byId = Object.fromEntries(positions.map((p) => [p.id, p]));
  assert.equal(byId[1].x, 500);
  assert.equal(byId[1].y, 400);
  assert.equal(byId[1].moved, true);
  // The unmoved item still flows from the first open slot.
  close(byId[2].x, 10, "item2 x");
  close(byId[2].y, 10, "item2 y");
});

test("computeHoneycombLayout always leaves room for at least one column", () => {
  const { positions } = computeHoneycombLayout([{ id: 1 }, { id: 2 }], 1);
  const byId = Object.fromEntries(positions.map((p) => [p.id, p]));
  close(byId[1].x, 10, "item1 x");
  close(byId[2].y, 85, "item2 y (wraps to next row)");
});
