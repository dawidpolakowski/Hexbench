/* global module */
// Note-card grid geometry (pure — no DOM). Loaded as a plain script before
// renderer.js so these names are available globally in the browser, and
// required directly from Node tests.

const NOTE_W = 168, NOTE_H = 96, NOTE_GAP = 10, NOTE_PAD = 8;

// Snap a dropped position to the nearest aligned slot (magnetic).
function snapNote(x, y) {
  const col = Math.max(0, Math.round((x - NOTE_PAD) / (NOTE_W + NOTE_GAP)));
  const row = Math.max(0, Math.round((y - NOTE_PAD) / (NOTE_H + NOTE_GAP)));
  return { x: NOTE_PAD + col * (NOTE_W + NOTE_GAP), y: NOTE_PAD + row * (NOTE_H + NOTE_GAP) };
}

// Lay a set of note cards into a grid within `availWidth`. Cards with a
// custom nx/ny (dragged) keep that position; the rest flow into open slots
// in order. Returns { positions: [{id,x,y,moved}], height }.
function computeNoteGridLayout(items, availWidth) {
  const cols = Math.max(1, Math.floor((availWidth + NOTE_GAP) / (NOTE_W + NOTE_GAP)));
  let slot = 0;
  let maxBottom = 0;
  const positions = items.map((n) => {
    const moved = Number.isFinite(n.nx) && Number.isFinite(n.ny);
    let x, y;
    if (moved) {
      x = n.nx; y = n.ny;
    } else {
      const row = Math.floor(slot / cols), col = slot % cols;
      x = NOTE_PAD + col * (NOTE_W + NOTE_GAP);
      y = NOTE_PAD + row * (NOTE_H + NOTE_GAP);
      slot++;
    }
    maxBottom = Math.max(maxBottom, y + NOTE_H);
    return { id: n.id, x, y, moved };
  });
  return { positions, height: maxBottom + NOTE_PAD };
}

if (typeof module !== "undefined") {
  module.exports = { NOTE_W, NOTE_H, NOTE_GAP, NOTE_PAD, snapNote, computeNoteGridLayout };
}
