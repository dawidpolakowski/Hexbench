// Pure notes-array logic (no persistence, no Electron). Each function takes
// the current notes array and returns the next one, so notesStore.js just
// wraps these around electron-store reads/writes.

// type: "text" | "list"; listStyle: "bullet" | "number"
function buildNote(now = Date.now()) {
  return { id: now, title: "", body: "", type: "text", listStyle: "bullet", created: now, updated: now };
}

function createNote(notes, now = Date.now()) {
  const note = buildNote(now);
  return { notes: [note, ...notes], note };
}

function updateNote(notes, id, data = {}, now = Date.now()) {
  const next = notes.slice();
  const note = next.find((n) => n.id === id);
  if (note) {
    let contentChanged = false;
    if (typeof data.title === "string") { note.title = data.title; contentChanged = true; }
    if (typeof data.body === "string") { note.body = data.body; contentChanged = true; }
    if (data.type === "text" || data.type === "list") { note.type = data.type; contentChanged = true; }
    if (data.listStyle === "bullet" || data.listStyle === "number") { note.listStyle = data.listStyle; contentChanged = true; }
    // Custom grid position (null resets to flow). A move doesn't count as an edit.
    if (data.nx === null || data.ny === null) { delete note.nx; delete note.ny; }
    else {
      if (typeof data.nx === "number") note.nx = data.nx;
      if (typeof data.ny === "number") note.ny = data.ny;
    }
    if (contentChanged) note.updated = now;
  }
  return next;
}

function deleteNote(notes, id) {
  return notes.filter((n) => n.id !== id);
}

module.exports = { buildNote, createNote, updateNote, deleteNote };
