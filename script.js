const addBtn = document.getElementById("addBtn");
const eventList = document.getElementById("eventList");

let events = JSON.parse(localStorage.getItem("events")) || [];

// Show saved events
function displayEvents() {
  eventList.innerHTML = "";
  events.forEach((event, i) => {
    const li = document.createElement("li");
    li.className = "event";
    li.innerHTML = `
      <h3>${event.title}</h3>
      <p>${event.desc}</p>
      <small>⏰ ${new Date(event.datetime).toLocaleString()}</small><br>
      <button class="delete-btn" onclick="deleteEvent(${i})">Delete</button>
    `;
    eventList.appendChild(li);
  });
}

// Add new event
addBtn.addEventListener("click", () => {
  const title = document.getElementById("title").value;
  const desc = document.getElementById("desc").value;
  const datetime = document.getElementById("datetime").value;

  if (!title || !datetime) {
    alert("Please enter a title and date/time!");
    return;
  }

  const newEvent = { title, desc, datetime };
  events.push(newEvent);
  localStorage.setItem("events", JSON.stringify(events));
  displayEvents();
  scheduleNotification(newEvent);

  document.getElementById("title").value = "";
  document.getElementById("desc").value = "";
  document.getElementById("datetime").value = "";
});

// Delete event
function deleteEvent(index) {
  events.splice(index, 1);
  localStorage.setItem("events", JSON.stringify(events));
  displayEvents();
}

// Schedule reminder
function scheduleNotification(event) {
  const time = new Date(event.datetime).getTime();
  const delay = time - Date.now();

  if (delay > 0) {
    setTimeout(() => {
      new Notification("🦈 SharkFin Reminder", {
        body: `${event.title} — ${event.desc}`,
        icon: "https://cdn-icons-png.flaticon.com/512/616/616408.png"
      });
    }, delay);
  }
}

// Ask for notification permission
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

displayEvents();
