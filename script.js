const STORAGE_KEY = "golden-star-fc-players";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Bellashmurda1@";

const registrationForm = document.querySelector("#registration-form");
const registrationFeedback = document.querySelector("#registration-feedback");
const loginForm = document.querySelector("#login-form");
const loginFeedback = document.querySelector("#login-feedback");
const dashboard = document.querySelector("#admin-dashboard");
const playersTable = document.querySelector("#players-table");
const emptyState = document.querySelector("#empty-state");
const playerCount = document.querySelector("#player-count");
const editForm = document.querySelector("#edit-form");
const editFeedback = document.querySelector("#edit-feedback");
const dashboardFeedback = document.querySelector("#dashboard-feedback");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = new Date().getFullYear();

function getPlayers() {
  try {
    const storedPlayers = localStorage.getItem(STORAGE_KEY);
    if (!storedPlayers) return [];
    const players = JSON.parse(storedPlayers);
    if (!Array.isArray(players)) throw new Error("Stored player data is not a list.");
    return players;
  } catch (error) {
    console.error("Could not read player registrations:", error);
    throw error;
  }
}

function savePlayers(players) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    return true;
  } catch (error) {
    console.error("Could not save player registrations:", error);
    return false;
  }
}

function createPlayerId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function setFeedback(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function renderPlayers() {
  let players;
  try {
    players = getPlayers();
  } catch {
    setFeedback(dashboardFeedback, "Could not load player records. Your saved data has not been changed.", true);
    return;
  }

  playersTable.replaceChildren();
  playerCount.textContent = String(players.length);
  emptyState.hidden = players.length > 0;

  for (const player of players) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = player.name;
    const contactCell = document.createElement("td");
    contactCell.textContent = player.email;
    const positionCell = document.createElement("td");
    positionCell.textContent = player.position;
    const ageCell = document.createElement("td");
    ageCell.textContent = player.age;
    const actionCell = document.createElement("td");
    const editButton = document.createElement("button");
    editButton.className = "edit-button";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => openEditor(player));
    actionCell.append(editButton);
    row.append(nameCell, contactCell, positionCell, ageCell, actionCell);
    playersTable.append(row);
  }
}

function openEditor(player) {
  editForm.reset();
  editForm.elements.id.value = player.id;
  editForm.elements.name.value = player.name;
  editForm.elements.age.value = player.age;
  editForm.elements.email.value = player.email;
  editForm.elements.phone.value = player.phone;
  editForm.elements.position.value = player.position;
  editForm.elements.message.value = player.message || "";
  document.querySelector("#edit-form-heading").textContent = "EDIT PLAYER";
  document.querySelector("#edit-player-title").textContent = player.name;
  document.querySelector("#save-player-button").innerHTML = "Save changes <span>↗</span>";
  document.querySelector("#delete-player").hidden = false;
  setFeedback(editFeedback, "");
  editForm.hidden = false;
  editForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function startNewPlayer() {
  editForm.reset();
  editForm.elements.id.value = "";
  document.querySelector("#edit-form-heading").textContent = "NEW PLAYER";
  document.querySelector("#edit-player-title").textContent = "Add a player";
  document.querySelector("#save-player-button").innerHTML = "Add player <span>↗</span>";
  document.querySelector("#delete-player").hidden = true;
  setFeedback(editFeedback, "");
  editForm.hidden = false;
  editForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

if (registrationForm) {
  registrationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(registrationForm);
    const player = Object.fromEntries(formData.entries());
    player.age = Number(player.age);
    player.id = createPlayerId();
    player.createdAt = new Date().toISOString();
    let players;
    try {
      players = getPlayers();
    } catch {
      setFeedback(registrationFeedback, "We couldn’t read saved registrations, so your details were not saved. Please try again.", true);
      return;
    }

    if (!savePlayers([...players, player])) {
      setFeedback(registrationFeedback, "We couldn’t save your registration in this browser. Please try again.", true);
      return;
    }

    registrationForm.reset();
    setFeedback(registrationFeedback, "Thanks for registering! Your details have been saved.");
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const username = formData.get("username");
    const password = formData.get("password");

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      setFeedback(loginFeedback, "That username or password doesn’t match. Please try again.", true);
      return;
    }

    setFeedback(loginFeedback, "");
    loginForm.hidden = true;
    dashboard.hidden = false;
    renderPlayers();
  });

  document.querySelector("#logout-button").addEventListener("click", () => {
    dashboard.hidden = true;
    loginForm.hidden = false;
    loginForm.reset();
    editForm.hidden = true;
    setFeedback(loginFeedback, "");
  });

  document.querySelector("#new-player-button").addEventListener("click", startNewPlayer);

  document.querySelector("#cancel-edit").addEventListener("click", () => {
    editForm.hidden = true;
  });

  editForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(editForm);
    const id = formData.get("id");
    const updatedPlayer = Object.fromEntries(formData.entries());
    updatedPlayer.age = Number(updatedPlayer.age);
    let players;
    try {
      players = getPlayers();
    } catch {
      setFeedback(editFeedback, "Could not read saved player records. Your changes were not saved.", true);
      return;
    }
    const isNewPlayer = !id;
    updatedPlayer.id = id || createPlayerId();
    const playerExists = players.some((player) => player.id === id);

    if (!isNewPlayer && !playerExists) {
      setFeedback(editFeedback, "This player could not be found. Refresh the dashboard and try again.", true);
      return;
    }

    if (isNewPlayer) updatedPlayer.createdAt = new Date().toISOString();
    const updatedPlayers = isNewPlayer
      ? [...players, updatedPlayer]
      : players.map((player) => player.id === id ? { ...player, ...updatedPlayer } : player);

    if (!savePlayers(updatedPlayers)) {
      setFeedback(editFeedback, "We couldn’t save those changes. Please try again.", true);
      return;
    }

    renderPlayers();
    editForm.hidden = true;
    setFeedback(dashboardFeedback, isNewPlayer ? "Player added and saved." : "Player changes saved.");
  });

  document.querySelector("#delete-player").addEventListener("click", () => {
    const id = editForm.elements.id.value;
    let players;
    try {
      players = getPlayers().filter((player) => player.id !== id);
    } catch {
      setFeedback(editFeedback, "Could not read saved player records. This player was not deleted.", true);
      return;
    }
    if (!savePlayers(players)) {
      setFeedback(editFeedback, "We couldn’t delete this player. Please try again.", true);
      return;
    }
    editForm.hidden = true;
    renderPlayers();
    setFeedback(dashboardFeedback, "Player deleted.");
  });
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      siteNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    }
  });
}
