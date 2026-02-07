const TASK_KEY = "college_planner_tasks";
const SETTINGS_KEY = "college_planner_settings";

const form = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const todayList = document.getElementById("today-list");
const todayMinutesEl = document.getElementById("today-minutes");
const banner = document.getElementById("banner");
const planOutput = document.getElementById("plan-output");

const modal = document.getElementById("task-modal");
const modalTitle = document.getElementById("modal-title");
const addTaskOpen = document.getElementById("add-task-open");
const modalClose = document.getElementById("modal-close");
const helpToggle = document.getElementById("help-toggle");
const help = document.getElementById("help");

let tasks = [];
let editingId = null;
let activeFilter = "today";

const PRIORITY_ORDER = { High: 0, Med: 1, Low: 2 };

const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const useApi = isLocalhost;

function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? JSON.parse(raw) : { notificationsEnabled: false };
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function loadTasks() {
  if (useApi) {
    const response = await fetch("/api/tasks");
    tasks = await response.json();
  } else {
    const raw = localStorage.getItem(TASK_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  }
  render();
}

async function saveTask(task) {
  if (useApi) {
    const method = tasks.some((t) => t.id === task.id) ? "PUT" : "POST";
    const url = method === "PUT" ? `/api/tasks/${task.id}` : "/api/tasks";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
  } else {
    const existingIndex = tasks.findIndex((t) => t.id === task.id);
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
  }
  await loadTasks();
}

async function deleteTask(taskId) {
  if (useApi) {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  } else {
    tasks = tasks.filter((t) => t.id !== taskId);
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
  }
  await loadTasks();
}

function parseDate(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  const date = parseDate(dateString);
  return date.toLocaleDateString();
}

function isToday(dateString) {
  const date = parseDate(dateString);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isOverdue(dateString) {
  const date = parseDate(dateString);
  if (!date) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date < today;
}

function isThisWeek(dateString) {
  const date = parseDate(dateString);
  if (!date) return false;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date >= start && date <= end;
}

function sortTasks(list) {
  return [...list].sort((a, b) => {
    const dateA = parseDate(a.dueDate) || new Date(2999, 11, 31);
    const dateB = parseDate(b.dueDate) || new Date(2999, 11, 31);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}

function getFilteredTasks() {
  const base = tasks.filter((task) => {
    if (activeFilter === "completed") return task.completed;
    if (activeFilter === "overdue") return !task.completed && isOverdue(task.dueDate);
    if (activeFilter === "today") return !task.completed && isToday(task.dueDate);
    if (activeFilter === "week") return !task.completed && isThisWeek(task.dueDate);
    return !task.completed;
  });
  return sortTasks(base);
}

function getTodayTopFive() {
  const active = tasks.filter((task) => !task.completed);
  const sorted = active.sort((a, b) => {
    const scoreA = isOverdue(a.dueDate)
      ? 0
      : isToday(a.dueDate)
      ? 1
      : 2;
    const scoreB = isOverdue(b.dueDate)
      ? 0
      : isToday(b.dueDate)
      ? 1
      : 2;
    if (scoreA !== scoreB) return scoreA - scoreB;
    const dateA = parseDate(a.dueDate) || new Date(2999, 11, 31);
    const dateB = parseDate(b.dueDate) || new Date(2999, 11, 31);
    return dateA - dateB;
  });
  return sorted.slice(0, 5);
}

function totalTodayMinutes(list) {
  return list.reduce((sum, task) => sum + (Number(task.minutes) || 30), 0);
}

function render() {
  renderBanner();
  renderTasks();
  renderToday();
}

function renderBanner() {
  const hasDue = tasks.some(
    (task) => !task.completed && (isOverdue(task.dueDate) || isToday(task.dueDate))
  );
  banner.hidden = !hasDue;
}

function renderTasks() {
  taskList.innerHTML = "";
  const filtered = getFilteredTasks();
  if (filtered.length === 0) {
    taskList.innerHTML = `<li class="task"><div class="task-info">No tasks here yet.</div></li>`;
    return;
  }

  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", async () => {
      task.completed = checkbox.checked;
      await saveTask(task);
    });

    const info = document.createElement("div");
    info.className = "task-info";
    const title = document.createElement("strong");
    title.textContent = task.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    const parts = [formatDate(task.dueDate), task.course || "No course", task.priority];
    if (task.minutes) parts.push(`${task.minutes} min`);
    meta.textContent = parts.join(" • ");

    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn light";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => openModal(task));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn light";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      await deleteTask(task.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(info);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
}

function renderToday() {
  todayList.innerHTML = "";
  const list = getTodayTopFive();
  if (list.length === 0) {
    todayList.innerHTML = `<li class="task"><div class="task-info">Nothing urgent today.</div></li>`;
  }
  list.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task";
    const info = document.createElement("div");
    info.className = "task-info";
    const title = document.createElement("strong");
    title.textContent = task.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = `${formatDate(task.dueDate)} • ${task.priority}`;
    info.appendChild(title);
    info.appendChild(meta);
    li.appendChild(info);
    todayList.appendChild(li);
  });

  todayMinutesEl.textContent = totalTodayMinutes(list);
}

function openModal(task = null) {
  modal.hidden = false;
  planOutput.hidden = true;
  if (task) {
    editingId = task.id;
    modalTitle.textContent = "Edit Task";
    form.title.value = task.title;
    form.dueDate.value = task.dueDate || "";
    form.course.value = task.course || "";
    form.priority.value = task.priority || "Med";
    form.minutes.value = task.minutes || "";
  } else {
    editingId = null;
    modalTitle.textContent = "Add Task";
    form.reset();
  }
  form.title.focus();
}

function closeModal() {
  modal.hidden = true;
  form.reset();
  editingId = null;
}

function buildPlan() {
  const list = getTodayTopFive();
  if (list.length === 0) {
    planOutput.textContent = "No tasks to plan yet.";
    planOutput.hidden = false;
    return;
  }

  const blocks = [];
  list.forEach((task) => {
    const minutes = Number(task.minutes) || 30;
    let remaining = minutes;
    while (remaining > 0) {
      const chunk = Math.min(25, remaining);
      blocks.push({
        task: task.title,
        focus: chunk,
        break: 5,
      });
      remaining -= chunk;
    }
  });

  const lines = blocks.map(
    (block, idx) =>
      `Block ${idx + 1}: ${block.task} — ${block.focus} min focus + ${block.break} min break`
  );
  planOutput.textContent = lines.join("\n");
  planOutput.hidden = false;
}

function applyTemplate(type) {
  openModal();
  if (type === "assignment") {
    form.title.value = "[Course] Assignment";
  }
  if (type === "study") {
    form.title.value = "Study session";
    form.minutes.value = 60;
    form.priority.value = "Med";
  }
  if (type === "exam") {
    form.title.value = "[Course] Quiz/Exam";
    form.priority.value = "High";
    form.dueDate.required = true;
  } else {
    form.dueDate.required = false;
  }
  form.title.focus();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const task = {
    id: editingId || crypto.randomUUID(),
    title: form.title.value.trim(),
    dueDate: form.dueDate.value || "",
    course: form.course.value.trim(),
    priority: form.priority.value,
    minutes: form.minutes.value ? Number(form.minutes.value) : "",
    completed: false,
  };

  if (!task.title) {
    form.title.focus();
    return;
  }

  if (editingId) {
    const existing = tasks.find((t) => t.id === editingId);
    if (existing) {
      task.completed = existing.completed;
    }
  }

  await saveTask(task);
  closeModal();
});

addTaskOpen.addEventListener("click", () => openModal());
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

helpToggle.addEventListener("click", () => {
  help.hidden = !help.hidden;
});

Array.from(document.querySelectorAll(".filter")).forEach((button) => {
  button.addEventListener("click", () => {
    Array.from(document.querySelectorAll(".filter")).forEach((btn) =>
      btn.classList.remove("active")
    );
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderTasks();
  });
});

Array.from(document.querySelectorAll("[data-template]")).forEach((button) => {
  button.addEventListener("click", () => applyTemplate(button.dataset.template));
});

planOutput.addEventListener("click", () => {
  planOutput.hidden = true;
});

document.getElementById("plan-day").addEventListener("click", buildPlan);

loadTasks();
