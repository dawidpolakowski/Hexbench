/* global module */
// Pointy-top hexagon geometry + honeycomb layout math (pure — no DOM). Loaded
// as a plain script before renderer.js so these names are available globally
// in the browser, and required directly from Node tests.

const HEX_R = 50;
const HEX_W = Math.sqrt(3) * HEX_R;
const HEX_H = 2 * HEX_R;
const HEX_VSTEP = 1.5 * HEX_R;
const HEX_PAD = 10;

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

// Snap a dropped hex to the nearest honeycomb slot (magnetic).
function snapHex(x, y) {
  const row = Math.max(0, Math.round((y - HEX_PAD) / HEX_VSTEP));
  const off = row % 2 ? HEX_W / 2 : 0;
  const col = Math.max(0, Math.round((x - HEX_PAD - off) / HEX_W));
  return { x: HEX_PAD + col * HEX_W + off, y: HEX_PAD + row * HEX_VSTEP };
}

// Lay a set of items into a honeycomb within `availWidth`. Items with a
// custom hx/hy (dragged) keep that position; the rest flow into open slots
// in order. Returns { positions: [{id,x,y,moved}], height }.
function computeHoneycombLayout(items, availWidth) {
  const cols = Math.max(1, Math.floor((availWidth - HEX_W / 2) / HEX_W));
  let slot = 0;
  let maxBottom = 0;
  const positions = items.map((item) => {
    const moved = Number.isFinite(item.hx) && Number.isFinite(item.hy);
    let x, y;
    if (moved) {
      x = item.hx; y = item.hy;
    } else {
      const row = Math.floor(slot / cols), col = slot % cols;
      x = HEX_PAD + col * HEX_W + (row % 2 ? HEX_W / 2 : 0);
      y = HEX_PAD + row * HEX_VSTEP;
      slot++;
    }
    maxBottom = Math.max(maxBottom, y + HEX_H);
    return { id: item.id, x, y, moved };
  });
  return { positions, height: maxBottom + HEX_PAD };
}

if (typeof module !== "undefined") {
  module.exports = { HEX_R, HEX_W, HEX_H, HEX_VSTEP, HEX_PAD, hexPoints, snapHex, computeHoneycombLayout };
}
