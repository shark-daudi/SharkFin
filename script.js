let events = JSON.parse(localStorage.getItem("events")) || [];
let editIndex = null;

// Elements
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const dateInput = document.getElementById("datetime");
const saveBtn = document.getElementById("saveBtn");
const updateBtn = document.getElementById("updateBtn");
const searchBar = document.getElementById("searchBar");
const eventList = document.getElementById("eventList");

// ✅ Ask for notification permission when the app loads
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Save new event
saveBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  const datetime = dateInput.value;

  if (!title || !datetime) {
    alert("Please enter a title and date/time!");
    return;
  }

  const newEvent = { title, description, datetime, notified: false };
  events.push(newEvent);
  localStorage.setItem("events", JSON.stringify(events));

  clearForm();
  displayEvents();
});

// Display all events
function displayEvents(filter = "") {
  eventList.innerHTML = "";
  const filtered = events.filter(ev =>
    ev.title.toLowerCase().includes(filter.toLowerCase()) ||
    ev.description.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    eventList.innerHTML = "<p>No events found.</p>";
    return;
  }

  filtered.forEach((ev, index) => {
    const div = document.createElement("div");
    div.classList.add("event");

    div.innerHTML = `
      <div class="event-title">${ev.title}</div>
      <div class="event-desc">${ev.description}</div>
      <div class="event-time">${new Date(ev.datetime).toLocaleString()}</div>
      <div class="actions">
        <button onclick="editEvent(${index})">Edit</button>
        <button class="delete" onclick="deleteEvent(${index})">Delete</button>
      </div>
    `;
    eventList.appendChild(div);
  });
}

// Delete event
function deleteEvent(index) {
  if (confirm("Delete this event?")) {
    events.splice(index, 1);
    localStorage.setItem("events", JSON.stringify(events));
    displayEvents(searchBar.value);
  }
}

// Edit event
function editEvent(index) {
  const ev = events[index];
  titleInput.value = ev.title;
  descInput.value = ev.description;
  dateInput.value = ev.datetime;

  editIndex = index;
  saveBtn.classList.add("hidden");
  updateBtn.classList.remove("hidden");
}

// Update event
updateBtn.addEventListener("click", () => {
  if (editIndex === null) return;

  events[editIndex] = {
    ...events[editIndex],
    title: titleInput.value,
    description: descInput.value,
    datetime: dateInput.value,
    notified: false
  };
  localStorage.setItem("events", JSON.stringify(events));

  clearForm();
  displayEvents();
  saveBtn.classList.remove("hidden");
  updateBtn.classList.add("hidden");
  editIndex = null;
});

// Search
searchBar.addEventListener("input", () => {
  displayEvents(searchBar.value);
});

// Clear input fields
function clearForm() {
  titleInput.value = "";
  descInput.value = "";
  dateInput.value = "";
}

// 🕒 Reminder check (runs every 30 seconds)
setInterval(() => {
  const now = new Date().getTime();

  events.forEach((ev, index) => {
    const eventTime = new Date(ev.datetime).getTime();

    // Check if event time is within the last minute and not already notified
    if (eventTime <= now && !ev.notified) {
      showNotification(ev.title, ev.description);
      events[index].notified = true;
      localStorage.setItem("events", JSON.stringify(events));
    }
  });
}, 30000);

// ✅ Function to show browser notification
function showNotification(title, description) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🦈 SharkFin Reminder", {
      body: `${title}\n${description}`,
      icon: "https://cdn-icons-png.flaticon.com/512/616/616408.png" // shark icon
    });
  }
}

// Initial load
displayEvents();
