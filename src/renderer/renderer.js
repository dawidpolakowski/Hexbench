/* global hexClip */

let history = [];
let notes = [];
let activeNoteId = null;
let noteView = "list"; // "list" | "grid"
let view = "list";      // "list" | "grid" | "notes"
let filter = "all";     // all | text | link | code | pinned
let selected = [];      // hex view multi-selection (item ids, in selection order)
let animateGrid = true; // play the pop-in animation on the next full hex render

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const $ = (id) => document.getElementById(id);

// ── Helpers ──────────────────────────────────────────────────────────────────
// relTime, typeIcon: src/renderer/textFormat.js (loaded before this script)

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(s) {
  return esc(s).replace(/"/g, "&quot;");
}

// ── Filtering ────────────────────────────────────────────────────────────────
function filtered() {
  const q = $("search").value.toLowerCase();
  return history.filter((h) => {
    if (filter === "pinned") return h.pinned && (!q || h.text.toLowerCase().includes(q));
    if (filter !== "all" && h.type !== filter) return false;
    return !q || h.text.toLowerCase().includes(q);
  });
}

// ── Render ───────────────────────────────────────────────────────────────────
function render() {
  if (view === "notes") { renderNotes(); return; }
  const items = filtered();
  $("count").textContent = `${items.length} item${items.length !== 1 ? "s" : ""}`;
  if (view === "list") renderList(items);
  else renderHex(items);
}

function itemHTML(i) {
  const preview = i.text.replace(/\n/g, " ").slice(0, 120);
  const pin = i.pinned && filter !== "pinned" ? '<span class="pin-pill">saved</span>' : "";
  const title = i.title ? `<span class="item-title">${esc(i.title)}</span>` : "";
  return `<div class="item" data-id="${i.id}">
    <span class="item-icon">${typeIcon(i.type)}</span>
    <div class="item-body">
      <div class="item-text">${title}<span class="badge badge-${i.type}">${i.type}</span>${esc(preview)}${pin}</div>
      <div class="item-meta">${relTime(i.time)} · ${i.text.length} chars</div>
    </div>
    <div class="item-actions">
      <button class="act-btn${i.pinned ? " pinned" : ""}" data-action="pin" data-id="${i.id}" title="${i.pinned ? "Unpin" : "Pin"}">📌</button>
      <button class="act-btn" data-action="del" data-id="${i.id}" title="Delete">✕</button>
    </div>
  </div>`;
}

function renderList(items) {
  const list = $("list");
  if (!items.length) {
    list.innerHTML = '<div class="empty"><span class="empty-icon">⬡</span>Nothing here yet</div>';
    return;
  }
  const pinned = items.filter((i) => i.pinned);
  const rest = items.filter((i) => !i.pinned);
  let html = "";
  if (pinned.length && filter !== "pinned") {
    html += '<div class="section-label">Pinned</div>';
    pinned.forEach((i) => (html += itemHTML(i)));
    if (rest.length) html += '<div class="section-label">Recent</div>';
  }
  (filter === "pinned" ? pinned : rest).forEach((i) => (html += itemHTML(i)));
  list.innerHTML = html;
}

// Each tile is a rectangle sized to its own text, wrapping into rows and
// packing left-to-right to fill the available width (plain CSS flex-wrap —
// no position math needed).
function hexCellHTML(item, idx, anim) {
  const cls = `hex-cell hex-${item.type}${item.pinned ? " pinned" : ""}${selected.includes(item.id) ? " active" : ""}${anim ? " anim" : ""}`;
  const delay = anim ? ` style="animation-delay:${Math.min(idx * 16, 480)}ms"` : "";
  const title = item.title ? `<div class="hex-cell-title">${esc(item.title)}</div>` : "";
  const flat = item.text.replace(/\s+/g, " ").trim().slice(0, 200);
  return `<div class="${cls}" data-id="${item.id}"${delay}>
    ${title}<div class="hex-cell-text">${esc(flat)}</div>
  </div>`;
}

function renderTiles(container, items, anim) {
  container.innerHTML = items.map((item, idx) => hexCellHTML(item, idx, anim)).join("");
}

function renderHex(items) {
  const anim = animateGrid;
  const pinned = items.filter((i) => i.pinned); // "Saved" section
  const rest = items.filter((i) => !i.pinned);

  const savedSection = $("savedSection");
  if (pinned.length) {
    savedSection.classList.remove("hidden");
    renderTiles($("savedGrid"), pinned, anim);
  } else {
    savedSection.classList.add("hidden");
    $("savedGrid").innerHTML = "";
  }
  renderTiles($("grid"), rest, anim);
  animateGrid = false; // only animate once per full render trigger
}

// Toggle a hex cell in/out of the multi-selection.
function toggleSelect(id) {
  const i = selected.indexOf(id);
  if (i === -1) selected.push(id);
  else selected.splice(i, 1);
  // Toggle highlight on the cell directly — avoids replaying the pop-in animation.
  const cell = document.querySelector(`.hex-cell[data-id="${id}"]`);
  if (cell) cell.classList.toggle("active", selected.includes(id));
  syncWorkbench();
  renderDetail();
}

function clearSelection() {
  selected = [];
  $("workbenchText").value = "";
  syncWorkbench();
  renderDetail();
  document.querySelectorAll(".hex-cell.active").forEach((c) => c.classList.remove("active"));
}

// Rebuild the bottom workbench text from the current selection.
function syncWorkbench() {
  const text = selected
    .map((id) => history.find((h) => h.id === id))
    .filter(Boolean)
    .map((it) => it.text)
    .join("\n\n");
  $("workbenchText").value = text;
  $("workbenchCount").textContent = `${selected.length} selected`;
}

// Right-side panel: lists every selected element with per-item copy/remove.
function renderDetail() {
  const detail = $("detail");
  if (!selected.length) {
    detail.innerHTML = '<div class="detail-empty">Click hex cells to<br>select &amp; gather them</div>';
    return;
  }
  let html = `<div class="detail-head">
    <span class="detail-count">${selected.length} selected</span>
    <div class="detail-head-actions">
      <button class="btn-secondary btn-sm" id="dCopyAll">Copy all</button>
      <button class="btn-secondary btn-sm btn-danger" id="dDeleteAll">Delete all</button>
      <button class="btn-secondary btn-sm" id="dClear">Clear</button>
    </div>
  </div>
  <div class="detail-list">`;
  selected.forEach((id) => {
    const it = history.find((h) => h.id === id);
    if (!it) return;
    html += `<div class="detail-item${it.pinned ? " saved" : ""}">
      <div class="detail-item-head">
        <span class="badge badge-${it.type}">${it.type}</span>
        <span class="detail-item-meta">${relTime(it.time)} · ${it.text.length} chars</span>
      </div>
      <input class="detail-title-input" data-title="${id}" value="${escAttr(it.title || "")}" placeholder="Add a title…" spellcheck="false" />
      <div class="detail-item-text">${esc(it.text)}</div>
      <div class="detail-item-actions">
        <button class="btn-secondary btn-sm" data-sel-copy="${id}">Copy</button>
        <button class="btn-secondary btn-sm${it.pinned ? " btn-saved" : ""}" data-sel-save="${id}">${it.pinned ? "★ Saved" : "☆ Save"}</button>
        <button class="btn-secondary btn-sm" data-sel-remove="${id}">Remove</button>
        <button class="btn-secondary btn-sm btn-danger" data-sel-delete="${id}">Delete</button>
      </div>
    </div>`;
  });
  html += "</div>";
  detail.innerHTML = html;

  $("dCopyAll").onclick = () => hexClip.copyText($("workbenchText").value);
  $("dDeleteAll").onclick = deleteSelected;
  $("dClear").onclick = clearSelection;
  detail.querySelectorAll("[data-sel-copy]").forEach((b) => {
    b.onclick = () => hexClip.copyItem(Number(b.dataset.selCopy));
  });
  detail.querySelectorAll("[data-sel-save]").forEach((b) => {
    b.onclick = async () => { history = await hexClip.pinItem(Number(b.dataset.selSave)); renderDetail(); render(); };
  });
  detail.querySelectorAll("[data-sel-remove]").forEach((b) => {
    b.onclick = () => toggleSelect(Number(b.dataset.selRemove));
  });
  detail.querySelectorAll("[data-sel-delete]").forEach((b) => {
    b.onclick = () => deleteHistoryItem(Number(b.dataset.selDelete));
  });
  detail.querySelectorAll("[data-title]").forEach((inp) => {
    inp.onchange = async () => {
      history = await hexClip.setTitle(Number(inp.dataset.title), inp.value.trim());
      render();
    };
  });
}

// Permanently delete a single item from history (and drop it from the selection).
async function deleteHistoryItem(id) {
  history = await hexClip.deleteItem(id);
  const i = selected.indexOf(id);
  if (i !== -1) selected.splice(i, 1);
  syncWorkbench();
  renderDetail();
  render(); // animateGrid already false — no replay
}

// Permanently delete every selected item.
async function deleteSelected() {
  for (const id of [...selected]) {
    history = await hexClip.deleteItem(id);
  }
  selected = [];
  syncWorkbench();
  renderDetail();
  render();
}

// ── Notes ────────────────────────────────────────────────────────────────────
// noteLines, noteToText, notePreview: src/renderer/noteText.js (loaded before this script)

// One card shape for both List (vertical stack) and Grid (flex-wrap, sized to
// content) — only the container's CSS differs between the two views.
function noteCardHtml(n) {
  const title = (n.title || "").trim() || "Untitled";
  const preview = notePreview(n).slice(0, 160);
  const active = n.id === activeNoteId ? " active" : "";
  const tag = n.type === "list" ? '<span class="note-tag">list</span>' : "";
  return `<div class="note-card${active}" data-note="${n.id}">
    <div class="note-card-title">${tag}${esc(title)}</div>
    <div class="note-card-preview">${esc(preview)}</div>
    <div class="note-card-meta">${relTime(n.updated)}</div>
  </div>`;
}

function renderNotes() {
  const q = $("search").value.toLowerCase();
  const items = notes.filter((n) => !q || `${n.title} ${n.body}`.toLowerCase().includes(q));
  $("notesCount").textContent = items.length
    ? `${items.length} note${items.length !== 1 ? "s" : ""}`
    : "No notes";

  const list = $("notesList");
  list.classList.toggle("grid-mode", noteView === "grid");
  list.classList.toggle("list-mode", noteView !== "grid");

  list.innerHTML = items.length
    ? items.map((n) => noteCardHtml(n)).join("")
    : '<div class="empty"><span class="empty-icon">🗒</span>No notes yet</div>';
  renderNoteEditor();
}

function renderNoteEditor() {
  const ed = $("noteEditor");
  const body = document.querySelector(".notes-body");
  const note = notes.find((n) => n.id === activeNoteId);
  // The editor panel is only shown while creating/editing a note; otherwise the
  // list takes the full width.
  if (!note) {
    body.classList.remove("editing");
    ed.innerHTML = "";
    return;
  }
  body.classList.add("editing");
  const isList = note.type === "list";
  ed.innerHTML = `
    <input id="noteTitle" class="note-title-input" placeholder="Title" value="${escAttr(note.title)}" spellcheck="false" />
    <div class="note-type-row">
      <div class="note-type-toggle">
        <button class="note-type-btn${!isList ? " active" : ""}" data-type="text">Text</button>
        <button class="note-type-btn${isList ? " active" : ""}" data-type="list">List</button>
      </div>
      <div class="note-style-toggle${isList ? "" : " hidden"}" id="noteStyleToggle">
        <button class="note-style-btn${note.listStyle !== "number" ? " active" : ""}" data-style="bullet">• Bullets</button>
        <button class="note-style-btn${note.listStyle === "number" ? " active" : ""}" data-style="number">1. Numbers</button>
      </div>
    </div>
    <textarea id="noteBody" class="note-body-input" placeholder="${isList ? "One item per line…" : "Write your note… (plain text)"}" spellcheck="false">${esc(note.body)}</textarea>
    <div id="notePreview" class="note-preview${isList ? "" : " hidden"}"></div>
    <div class="note-editor-actions">
      <span class="note-editor-meta" id="noteMeta">Edited ${relTime(note.updated)}</span>
      <button class="btn-secondary btn-sm" id="noteSave" disabled>Saved</button>
      <button class="btn-secondary btn-sm" id="noteOpenWin" title="Open in a separate window">Open in window</button>
      <button class="btn-secondary btn-sm" id="noteCopy">Copy</button>
      <button class="btn-secondary btn-sm btn-danger" id="noteDelete">Delete</button>
      <button class="btn-secondary btn-sm" id="noteCollapse" title="Close editor">Close</button>
    </div>`;

  const current = () => notes.find((n) => n.id === note.id) || note;
  const renderPreview = () => {
    const n = current();
    const prev = $("notePreview");
    if (n.type !== "list") { prev.classList.add("hidden"); return; }
    prev.classList.remove("hidden");
    const lines = noteLines($("noteBody").value);
    const tag = n.listStyle === "number" ? "ol" : "ul";
    prev.innerHTML = lines.length
      ? `<${tag} class="note-preview-list ${n.listStyle}">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</${tag}>`
      : '<div class="note-preview-empty">List items will preview here…</div>';
  };

  // Save without re-rendering the editor (keeps caret/focus). Autosaves on a debounce,
  // and the Save button flushes immediately; the button doubles as a saved/unsaved badge.
  let dirty = false;
  const setDirty = (d) => {
    dirty = d;
    const btn = $("noteSave");
    btn.textContent = d ? "Save" : "Saved";
    btn.classList.toggle("is-dirty", d);
    btn.disabled = !d;
  };
  const doSave = async () => {
    if (!dirty) return;
    notes = await hexClip.updateNote(note.id, { title: $("noteTitle").value, body: $("noteBody").value });
    setDirty(false);
    $("noteMeta").textContent = `Edited ${relTime(current().updated)}`;
  };
  const autosave = debounce(doSave, 350);
  const onEdit = () => { setDirty(true); autosave(); };
  $("noteTitle").oninput = onEdit;
  $("noteBody").oninput = () => { onEdit(); renderPreview(); };
  $("noteSave").onclick = doSave;

  ed.querySelectorAll(".note-type-btn").forEach((b) => {
    b.onclick = async () => {
      notes = await hexClip.updateNote(note.id, { type: b.dataset.type, title: $("noteTitle").value, body: $("noteBody").value });
      renderNoteEditor();
    };
  });
  ed.querySelectorAll(".note-style-btn").forEach((b) => {
    b.onclick = async () => {
      notes = await hexClip.updateNote(note.id, { listStyle: b.dataset.style });
      renderNoteEditor();
    };
  });

  $("noteOpenWin").onclick = async () => {
    await doSave();
    hexClip.openNoteWindow(note.id);
  };
  $("noteCopy").onclick = () => hexClip.copyText(noteToText(current()));
  $("noteDelete").onclick = async () => {
    notes = await hexClip.deleteNote(note.id);
    activeNoteId = null;
    renderNotes();
  };
  $("noteCollapse").onclick = () => { activeNoteId = null; renderNotes(); };

  renderPreview();
}

async function newNote(initial) {
  const note = await hexClip.createNote(initial);
  notes = await hexClip.getNotes();
  activeNoteId = note.id;
  if (view !== "notes") setView("notes");
  else renderNotes();
  setTimeout(() => $("noteTitle")?.focus(), 0);
}

// ── View / filter switching ──────────────────────────────────────────────────
function setView(v) {
  view = v;
  if (v === "grid") animateGrid = true;
  $("tabList").classList.toggle("tab-active", v === "list");
  $("tabGrid").classList.toggle("tab-active", v === "grid");
  $("tabNotes").classList.toggle("tab-active", v === "notes");
  $("listView").classList.toggle("hidden", v !== "list");
  $("hexView").classList.toggle("hidden", v !== "grid");
  $("notesView").classList.toggle("hidden", v !== "notes");
  // Clipboard-only chrome is hidden in the Notes view.
  $("filterRow").classList.toggle("hidden", v === "notes");
  $("clearBtn").classList.toggle("hidden", v === "notes");
  $("workbench").classList.toggle("hidden", v === "notes");
  $("search").placeholder = v === "notes" ? "Search notes…" : "Search clipboard…";
  render();
}

// ── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.body.className = theme;
  localStorage.setItem("theme", theme);
  document.querySelectorAll(".options-theme-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.theme === theme));
}

// ── Wiring ───────────────────────────────────────────────────────────────────
$("tabList").onclick = () => setView("list");
$("tabGrid").onclick = () => setView("grid");
$("tabNotes").onclick = () => setView("notes");

$("newNoteBtn").onclick = () => newNote();

const notesListEl = $("notesList");
// Plain click selects (both List and Grid view use the same card).
notesListEl.addEventListener("click", (e) => {
  const card = e.target.closest("[data-note]");
  if (card) { activeNoteId = Number(card.dataset.note); renderNotes(); }
});

// Double-click opens the note as a standalone sticky window.
notesListEl.addEventListener("dblclick", (e) => {
  const card = e.target.closest(".note-card");
  if (card) hexClip.openNoteWindow(Number(card.dataset.note));
});

function setNoteView(v) {
  noteView = v;
  localStorage.setItem("noteView", v);
  $("noteViewList").classList.toggle("active", v === "list");
  $("noteViewGrid").classList.toggle("active", v === "grid");
  renderNotes();
}
$("noteViewList").onclick = () => setNoteView("list");
$("noteViewGrid").onclick = () => setNoteView("grid");

// Workbench resize controls (S = 1 line, M = default, L = 80% of window).
function setWorkbenchSize(size) {
  const h = size === "min" ? 30 : size === "max" ? Math.round(window.innerHeight * 0.8) : 160;
  $("workbenchText").style.height = h + "px";
  localStorage.setItem("wbSize", size);
  $("wbMin").classList.toggle("wb-size-active", size === "min");
  $("wbMid").classList.toggle("wb-size-active", size === "mid");
  $("wbMax").classList.toggle("wb-size-active", size === "max");
}
$("wbMin").onclick = () => setWorkbenchSize("min");
$("wbMid").onclick = () => setWorkbenchSize("mid");
$("wbMax").onclick = () => setWorkbenchSize("max");

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.onclick = () => {
    document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("filter-active"));
    chip.classList.add("filter-active");
    filter = chip.dataset.filter;
    render();
  };
});

$("search").addEventListener("input", render);

$("list").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (btn) {
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "pin") history = await hexClip.pinItem(id);
    if (btn.dataset.action === "del") history = await hexClip.deleteItem(id);
    render();
    return;
  }
  const row = e.target.closest("[data-id]");
  if (row) {
    const id = Number(row.dataset.id);
    await hexClip.copyItem(id);
    // Copy only — keep the window open (no hide/minimize).
    row.classList.add("flash");
    setTimeout(() => row.classList.remove("flash"), 450);
  }
});

// Click a hex tile to toggle it in/out of the multi-selection.
const hexCanvas = document.querySelector(".hex-canvas-wrap");
hexCanvas.addEventListener("click", (e) => {
  const cell = e.target.closest(".hex-cell");
  if (cell) toggleSelect(Number(cell.dataset.id));
});

// Bottom workbench — plain editable text, copy / save-to-note / clear.
$("workbenchCopy").onclick = () => hexClip.copyText($("workbenchText").value);
$("workbenchToNote").onclick = () => {
  const body = $("workbenchText").value.trim();
  if (body) newNote({ body });
};
$("workbenchClear").onclick = clearSelection;

$("clearBtn").onclick = async () => { history = await hexClip.clearHistory(); render(); };

// Options panel
$("optionsBtn").onclick = (e) => { e.stopPropagation(); $("optionsPanel").classList.toggle("hidden"); };
document.addEventListener("click", (e) => {
  if (!$("optionsPanel").classList.contains("hidden") && !e.target.closest(".options-wrap")) {
    $("optionsPanel").classList.add("hidden");
  }
});

document.querySelectorAll(".options-theme-btn").forEach((b) => {
  b.onclick = () => applyTheme(b.dataset.theme);
});

function setToggle(el, on) { el.classList.toggle("options-toggle-on", on); }

$("privateToggle").onclick = async () => {
  const on = !$("privateToggle").classList.contains("options-toggle-on");
  const result = await hexClip.setPrivateMode(on);
  reflectPrivate(result);
};

$("startupToggle").onclick = async () => {
  const on = !$("startupToggle").classList.contains("options-toggle-on");
  await hexClip.setLoginItem(on);
  setToggle($("startupToggle"), on);
};

$("optionsClear").onclick = async () => { history = await hexClip.clearHistory(); render(); };
$("optionsExit").onclick = () => hexClip.windowQuit();

// About dialog
$("aboutBtn").onclick = () => { $("optionsPanel").classList.add("hidden"); $("aboutDialog").classList.remove("hidden"); };
$("aboutClose").onclick = () => $("aboutDialog").classList.add("hidden");
$("aboutDialog").onclick = (e) => { if (e.target === $("aboutDialog")) $("aboutDialog").classList.add("hidden"); };

// Window controls
$("winClose").onclick = () => hexClip.windowHide();
$("winMinimize").onclick = () => hexClip.windowMinimize();
$("winMaximize").onclick = () => hexClip.windowMaximize();

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!$("aboutDialog").classList.contains("hidden")) $("aboutDialog").classList.add("hidden");
    else hexClip.windowHide();
  }
});

// ── Private-mode reflection ──────────────────────────────────────────────────
function reflectPrivate(on) {
  setToggle($("privateToggle"), on);
  $("privateBadge").classList.toggle("hidden", !on);
}

// ── Main -> renderer events ──────────────────────────────────────────────────
hexClip.onRefresh((data) => { history = data; render(); });
hexClip.onPrivateMode((on) => reflectPrivate(on));
hexClip.onSwitchTab((tab) => setView(tab === "grid" ? "grid" : "list"));

// ── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  applyTheme(localStorage.getItem("theme") || "dark");
  $("aboutVersion").textContent = "v" + (await hexClip.getVersion());
  reflectPrivate(await hexClip.getPrivateMode());
  setToggle($("startupToggle"), await hexClip.getLoginItem());
  setNoteView(localStorage.getItem("noteView") || "list");
  setWorkbenchSize(localStorage.getItem("wbSize") || "mid");
  history = await hexClip.getHistory();
  notes = await hexClip.getNotes();
  syncWorkbench();
  renderDetail();
  render();
}

init();
