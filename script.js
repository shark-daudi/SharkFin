let events = JSON.parse(localStorage.getItem("sharkfin_events")) || [];
let editIndex = null;
let currentFilter = "all";
let currentSearch = "";

const titleInput  = document.getElementById("titleInput");
const descInput   = document.getElementById("descInput");
const dateInput   = document.getElementById("dateInput");
const tagInput    = document.getElementById("tagInput");
const saveBtn     = document.getElementById("saveBtn");
const updateBtn   = document.getElementById("updateBtn");
const clearBtn    = document.getElementById("clearBtn");
const searchBar   = document.getElementById("searchBar");
const eventList   = document.getElementById("eventList");
const eventCount  = document.getElementById("eventCount");
const sortSelect  = document.getElementById("sortSelect");
const formPanel   = document.getElementById("formPanel");
const collapseBtn = document.getElementById("collapseBtn");
const formLabel   = document.getElementById("formLabel");
const formHeader  = document.querySelector(".form-header");
const toast       = document.getElementById("toast");

// Notification permission
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Collapse toggle
formHeader.addEventListener("click", (e) => {
  if (e.target.closest(".icon-btn")) {
    formPanel.classList.toggle("collapsed");
  }
});

collapseBtn.addEventListener("click", () => {
  formPanel.classList.toggle("collapsed");
});

// Save
saveBtn.addEventListener("click", () => {
  const title    = titleInput.value.trim();
  const desc     = descInput.value.trim();
  const datetime = dateInput.value;
  const tag      = tagInput.value;

  if (!title || !datetime) {
    showToast("⚠️ Please add a title and date.");
    return;
  }

  events.push({ title, description: desc, datetime, tag, notified: false, id: Date.now() });
  persist();
  clearForm();
  render();
  showToast("✦ Event saved!");
  formPanel.classList.add("collapsed");
});

// Update
updateBtn.addEventListener("click", () => {
  if (editIndex === null) return;
  events[editIndex] = {
    ...events[editIndex],
    title: titleInput.value.trim(),
    description: descInput.value.trim(),
    datetime: dateInput.value,
    tag: tagInput.value,
    notified: false,
  };
  persist();
  clearForm();
  render();
  showToast("✦ Event updated!");
  saveBtn.classList.remove("hidden");
  updateBtn.classList.add("hidden");
  formLabel.textContent = "New Event";
  editIndex = null;
  formPanel.classList.add("collapsed");
});

clearBtn.addEventListener("click", () => {
  clearForm();
  if (editIndex !== null) {
    saveBtn.classList.remove("hidden");
    updateBtn.classList.add("hidden");
    formLabel.textContent = "New Event";
    editIndex = null;
  }
});

// Filter tabs
document.getElementById("filterTabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (!tab) return;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  currentFilter = tab.dataset.filter;
  render();
});

// Search
searchBar.addEventListener("input", () => {
  currentSearch = searchBar.value;
  render();
});

// Sort
sortSelect.addEventListener("change", render);

// Edit (global)
window.editEvent = (index) => {
  const ev = events[index];
  titleInput.value = ev.title;
  descInput.value  = ev.description || "";
  dateInput.value  = ev.datetime;
  tagInput.value   = ev.tag || "";
  editIndex = index;
  saveBtn.classList.add("hidden");
  updateBtn.classList.remove("hidden");
  formLabel.textContent = "Edit Event";
  formPanel.classList.remove("collapsed");
  formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
};

// Delete (global)
window.deleteEvent = (index) => {
  if (!confirm("Delete this event?")) return;
  events.splice(index, 1);
  persist();
  render();
  showToast("Event removed.");
};

function persist() {
  localStorage.setItem("sharkfin_events", JSON.stringify(events));
}

function clearForm() {
  titleInput.value = "";
  descInput.value  = "";
  dateInput.value  = "";
  tagInput.value   = "";
}

function getStatus(datetime) {
  const now     = Date.now();
  const evTime  = new Date(datetime).getTime();
  const diff    = evTime - now;
  if (diff < 0)                      return "past";
  if (diff < 60 * 60 * 1000)        return "imminent";  // < 1hr
  if (diff < 24 * 60 * 60 * 1000)   return "today";     // < 24hr
  return "upcoming";
}

function formatTime(datetime) {
  const d = new Date(datetime);
  const now = new Date();
  const isToday   = d.toDateString() === now.toDateString();
  const tomorrow  = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday)    return `Today · ${timeStr}`;
  if (isTomorrow) return `Tomorrow · ${timeStr}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) + " · " + timeStr;
}

function render() {
  const now = Date.now();
  const q   = currentSearch.toLowerCase();

  let filtered = events.filter((ev, i) => {
    ev._origIndex = i;
    const matchSearch = ev.title.toLowerCase().includes(q) || (ev.description || "").toLowerCase().includes(q);
    if (!matchSearch) return false;

    const evTime = new Date(ev.datetime).getTime();
    if (currentFilter === "upcoming") return evTime >= now;
    if (currentFilter === "past")     return evTime < now;
    return true;
  });

  const sortVal = sortSelect.value;
  filtered.sort((a, b) => {
    const at = new Date(a.datetime).getTime();
    const bt = new Date(b.datetime).getTime();
    if (sortVal === "soonest") return at - bt;
    if (sortVal === "oldest")  return at - bt;
    return bt - at; // newest
  });

  // Count label
  eventCount.textContent = filtered.length === 1 ? "1 event" : `${filtered.length} events`;

  // Header stats
  const upcoming = events.filter(e => new Date(e.datetime).getTime() >= now);
  const past     = events.filter(e => new Date(e.datetime).getTime() < now);
  document.getElementById("headerStats").innerHTML = `
    <div class="stat-chip"><span class="val">${upcoming.length}</span><span class="lbl">Upcoming</span></div>
    <div class="stat-chip"><span class="val">${past.length}</span><span class="lbl">Past</span></div>
    <div class="stat-chip"><span class="val">${events.length}</span><span class="lbl">Total</span></div>
  `;

  if (filtered.length === 0) {
    eventList.innerHTML = `
      <div class="empty-state">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
          <path d="M8 36C14 24 24 18 36 20L48 16L44 28C46 31 47 35 46 39C41 45 29 46 20 42L8 36Z" stroke="#00c8f0" stroke-width="1.5" fill="none"/>
          <path d="M36 20L46 10L44 28" stroke="#00c8f0" stroke-width="1.5" fill="none" opacity="0.5"/>
        </svg>
        <div><strong>Nothing here</strong><p>${currentSearch ? "No events match your search." : "Add your first event above."}</p></div>
      </div>`;
    return;
  }

  eventList.innerHTML = "";
  filtered.forEach((ev) => {
    const status    = getStatus(ev.datetime);
    const timeStr   = formatTime(ev.datetime);
    const tagClass  = ev.tag ? `tag-${ev.tag}` : "";
    const tagLabel  = ev.tag ? `<span class="event-tag ${tagClass}">${ev.tag}</span>` : "";

    const badgeMap = {
      past:     `<span class="time-badge badge-past">Past</span>`,
      today:    `<span class="time-badge badge-today">Today</span>`,
      imminent: `<span class="time-badge badge-imminent">Soon</span>`,
      upcoming: `<span class="time-badge badge-upcoming">Upcoming</span>`,
    };

    const card = document.createElement("div");
    card.className = `event-card ${status}`;
    card.innerHTML = `
      <div class="event-top">
        <div class="event-title">${escHtml(ev.title)}</div>
        ${tagLabel}
      </div>
      ${ev.description ? `<div class="event-desc">${escHtml(ev.description)}</div>` : ""}
      <div class="event-bottom">
        <div class="event-time">
          <span class="time-dot"></span>
          <span>${timeStr}</span>
          ${badgeMap[status]}
        </div>
        <div class="event-actions">
          <button class="act-btn act-edit" onclick="editEvent(${ev._origIndex})">Edit</button>
          <button class="act-btn act-delete" onclick="deleteEvent(${ev._origIndex})">Delete</button>
        </div>
      </div>`;
    eventList.appendChild(card);
  });
}

function escHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// Reminder check every 30s
setInterval(() => {
  const now = Date.now();
  events.forEach((ev, i) => {
    const evTime = new Date(ev.datetime).getTime();
    if (evTime <= now && !ev.notified) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🦈 SharkFin Reminder", {
          body: `${ev.title}${ev.description ? "\n" + ev.description : ""}`,
          icon: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
        });
      }
      events[i].notified = true;
      persist();
    }
  });
}, 30000);

render();
