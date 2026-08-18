const { test } = require("node:test");
const assert = require("node:assert/strict");
const { NOTE_W, NOTE_GAP, snapNote, computeNoteGridLayout } = require("../src/renderer/noteLayout");

test("snapNote snaps to the nearest aligned slot", () => {
  assert.deepEqual(snapNote(90, 60), { x: 8, y: 8 });
  assert.deepEqual(snapNote(190, 120), { x: 8 + NOTE_W + NOTE_GAP, y: 8 + 96 + 10 });
});

test("computeNoteGridLayout flows unmoved cards row by row", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const avail = 2 * (NOTE_W + NOTE_GAP) - NOTE_GAP; // exactly 2 columns
  const { positions, height } = computeNoteGridLayout(items, avail);
  const byId = Object.fromEntries(positions.map((p) => [p.id, p]));

  assert.deepEqual([byId[1].x, byId[1].y], [8, 8]);
  assert.deepEqual([byId[2].x, byId[2].y], [8 + NOTE_W + NOTE_GAP, 8]);
  assert.deepEqual([byId[3].x, byId[3].y], [8, 8 + 96 + 10]);
  positions.forEach((p) => assert.equal(p.moved, false));
  assert.equal(height, 8 + 96 + 10 + 96 + 8);
});

test("computeNoteGridLayout keeps a dragged card at its custom position", () => {
  const items = [{ id: 1, nx: 300, ny: 250 }, { id: 2 }];
  const { positions } = computeNoteGridLayout(items, 400);
  const byId = Object.fromEntries(positions.map((p) => [p.id, p]));
  assert.deepEqual([byId[1].x, byId[1].y, byId[1].moved], [300, 250, true]);
  assert.deepEqual([byId[2].x, byId[2].y, byId[2].moved], [8, 8, false]);
});
