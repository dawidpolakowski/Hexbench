const { test } = require("node:test");
const assert = require("node:assert/strict");
const logic = require("../src/main/notesLogic");

test("buildNote creates a fresh text note with matching id/created/updated", () => {
  const note = logic.buildNote(1000);
  assert.deepEqual(note, {
    id: 1000, title: "", body: "", type: "text", listStyle: "bullet", created: 1000, updated: 1000,
  });
});

test("createNote prepends a new note and returns it", () => {
  const notes = [{ id: 1 }];
  const { notes: next, note } = logic.createNote(notes, 2000);
  assert.equal(note.id, 2000);
  assert.deepEqual(next.map((n) => n.id), [2000, 1]);
  assert.equal(notes.length, 1, "does not mutate the input array");
});

test("updateNote applies title/body and bumps updated", () => {
  const notes = [{ id: 1, title: "", body: "", type: "text", listStyle: "bullet", created: 1, updated: 1 }];
  const next = logic.updateNote(notes, 1, { title: "Hi", body: "there" }, 500);
  const note = next.find((n) => n.id === 1);
  assert.equal(note.title, "Hi");
  assert.equal(note.body, "there");
  assert.equal(note.updated, 500);
});

test("updateNote accepts type/listStyle only from their allowed sets", () => {
  const next = logic.updateNote(
    [{ id: 1, type: "text", listStyle: "bullet", updated: 1 }],
    1, { type: "list", listStyle: "number" }, 2,
  );
  const note = next.find((n) => n.id === 1);
  assert.equal(note.type, "list");
  assert.equal(note.listStyle, "number");

  const unchanged = logic.updateNote(
    [{ id: 1, type: "text", listStyle: "bullet", updated: 1 }],
    1, { type: "bogus", listStyle: "bogus" }, 3,
  );
  const note2 = unchanged.find((n) => n.id === 1);
  assert.equal(note2.type, "text");
  assert.equal(note2.listStyle, "bullet");
});

test("updateNote ignores unrecognized data fields", () => {
  const notes = [{ id: 1, title: "a", updated: 1 }];
  const next = logic.updateNote(notes, 1, { nx: 10, ny: 20 }, 999);
  const note = next.find((n) => n.id === 1);
  assert.equal("nx" in note, false);
  assert.equal("ny" in note, false);
  assert.equal(note.updated, 1, "not a recognized edit");
});

test("updateNote is a no-op for an unknown id", () => {
  const notes = [{ id: 1, title: "a" }];
  const next = logic.updateNote(notes, 999, { title: "b" });
  assert.deepEqual(next, notes);
});

test("deleteNote removes only the matching id", () => {
  const notes = [{ id: 1 }, { id: 2 }];
  assert.deepEqual(logic.deleteNote(notes, 1).map((n) => n.id), [2]);
});
