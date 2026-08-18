const Store = require("electron-store");
const logic = require("./historyLogic");

const store = new Store();

const MAX_HISTORY = logic.MAX_HISTORY;

function getHistory() {
  return store.get("history", []);
}

function setHistory(history) {
  store.set("history", history);
  return history;
}

function addToHistory(entry) {
  return setHistory(logic.insertEntry(getHistory(), entry));
}

function togglePin(id) {
  return setHistory(logic.togglePin(getHistory(), id));
}

function setTitle(id, title) {
  return setHistory(logic.setTitle(getHistory(), id, title));
}

function deleteItem(id) {
  return setHistory(logic.deleteItem(getHistory(), id));
}

function clearHistory() {
  return setHistory(logic.clearKeepPinned(getHistory()));
}

function findItem(id) {
  return logic.findItem(getHistory(), id);
}

module.exports = {
  MAX_HISTORY,
  getHistory,
  setHistory,
  addToHistory,
  togglePin,
  setTitle,
  deleteItem,
  clearHistory,
  findItem,
};
