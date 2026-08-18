const { test } = require("node:test");
const assert = require("node:assert/strict");
const logic = require("../src/main/historyLogic");

test("insertEntry adds to the front", () => {
  const history = [{ id: 1, text: "a" }];
  const next = logic.insertEntry(history, { id: 2, text: "b" });
  assert.deepEqual(next.map((h) => h.id), [2, 1]);
  assert.equal(history.length, 1, "does not mutate the input array");
});

test("insertEntry de-duplicates by text, keeping the new entry at the front", () => {
  const history = [{ id: 1, text: "a" }, { id: 2, text: "b" }];
  const next = logic.insertEntry(history, { id: 3, text: "a" });
  assert.deepEqual(next.map((h) => h.id), [3, 2]);
});

test("insertEntry caps the list at maxHistory", () => {
  const history = [{ id: 1, text: "a" }, { id: 2, text: "b" }];
  const next = logic.insertEntry(history, { id: 3, text: "c" }, 2);
  assert.deepEqual(next.map((h) => h.id), [3, 1]);
});

test("togglePin flips the pinned flag on a matching item only", () => {
  const history = [{ id: 1, pinned: false }, { id: 2, pinned: false }];
  const next = logic.togglePin(history, 1);
  assert.equal(next.find((h) => h.id === 1).pinned, true);
  assert.equal(next.find((h) => h.id === 2).pinned, false);
  assert.equal(logic.togglePin(next, 1).find((h) => h.id === 1).pinned, false);
});

test("togglePin is a no-op for an unknown id", () => {
  const history = [{ id: 1, pinned: false }];
  const next = logic.togglePin(history, 999);
  assert.deepEqual(next, history);
});

test("setTitle sets or clears a title", () => {
  const history = [{ id: 1, title: "" }];
  assert.equal(logic.setTitle(history, 1, "Hello").find((h) => h.id === 1).title, "Hello");
  assert.equal(logic.setTitle(history, 1, "").find((h) => h.id === 1).title, "");
  assert.equal(logic.setTitle(history, 1, null).find((h) => h.id === 1).title, "");
});

test("setPos sets a custom position and clears it on null", () => {
  const history = [{ id: 1 }];
  const moved = logic.setPos(history, 1, 10, 20);
  const item = moved.find((h) => h.id === 1);
  assert.equal(item.hx, 10);
  assert.equal(item.hy, 20);

  const reset = logic.setPos(moved, 1, null, null);
  const resetItem = reset.find((h) => h.id === 1);
  assert.equal("hx" in resetItem, false);
  assert.equal("hy" in resetItem, false);
});

test("deleteItem removes only the matching id", () => {
  const history = [{ id: 1 }, { id: 2 }];
  assert.deepEqual(logic.deleteItem(history, 1).map((h) => h.id), [2]);
});

test("clearKeepPinned keeps only pinned items", () => {
  const history = [{ id: 1, pinned: true }, { id: 2, pinned: false }];
  assert.deepEqual(logic.clearKeepPinned(history).map((h) => h.id), [1]);
});

test("findItem returns the matching item or undefined", () => {
  const history = [{ id: 1, text: "a" }];
  assert.equal(logic.findItem(history, 1).text, "a");
  assert.equal(logic.findItem(history, 2), undefined);
});
