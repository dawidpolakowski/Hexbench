// Pure clipboard-history array logic (no persistence, no Electron). Each
// function takes the current history array and returns the next one, so
// store.js just wraps these around electron-store reads/writes.

const MAX_HISTORY = 500;

// Insert a new entry at the front, de-duplicating by text and capping length.
function insertEntry(history, entry, maxHistory = MAX_HISTORY) {
  let next = history.slice();
  const duplicate = next.findIndex((h) => h.text === entry.text);
  if (duplicate !== -1) next.splice(duplicate, 1);
  next.unshift(entry);
  if (next.length > maxHistory) next = next.slice(0, maxHistory);
  return next;
}

function togglePin(history, id) {
  const next = history.slice();
  const item = next.find((h) => h.id === id);
  if (item) item.pinned = !item.pinned;
  return next;
}

function setTitle(history, id, title) {
  const next = history.slice();
  const item = next.find((h) => h.id === id);
  if (item) item.title = title || "";
  return next;
}

function deleteItem(history, id) {
  return history.filter((h) => h.id !== id);
}

// Clearing keeps pinned items so favourites survive.
function clearKeepPinned(history) {
  return history.filter((h) => h.pinned);
}

function findItem(history, id) {
  return history.find((h) => h.id === id);
}

module.exports = {
  MAX_HISTORY,
  insertEntry,
  togglePin,
  setTitle,
  deleteItem,
  clearKeepPinned,
  findItem,
};
