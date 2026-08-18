const Store = require("electron-store");
const logic = require("./notesLogic");

const store = new Store();

// Standalone notes, persisted separately from clipboard history (key: "notes").
// A note is { id, title, body, created, updated }, newest-first.
function getNotes() {
  return store.get("notes", []);
}

function setNotes(notes) {
  store.set("notes", notes);
  return notes;
}

function createNote() {
  const { notes, note } = logic.createNote(getNotes());
  setNotes(notes);
  return note;
}

function updateNote(id, data = {}) {
  return setNotes(logic.updateNote(getNotes(), id, data));
}

function deleteNote(id) {
  return setNotes(logic.deleteNote(getNotes(), id));
}

module.exports = { getNotes, createNote, updateNote, deleteNote };
