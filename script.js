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

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The request could not be completed.");
  return result;
}

function setFeedback(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function setAdminView(isSignedIn) {
  loginForm.hidden = isSignedIn;
  dashboard.hidden = !isSignedIn;
  if (!isSignedIn) editForm.hidden = true;
}

async function renderPlayers() {
  try {
    const { players } = await apiRequest("/api/players");
    playersTable.replaceChildren();
    playerCount.textContent = String(players.length);
    emptyState.hidden = players.length > 0;

    for (const player of players) {
      const row = document.createElement("tr");
      for (const value of [player.name, player.email, player.position, player.age]) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }
      const actionCell = document.createElement("td");
      const editButton = document.createElement("button");
      editButton.className = "edit-button";
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => openEditor(player));
      actionCell.append(editButton);
      row.append(actionCell);
      playersTable.append(row);
    }
    setFeedback(dashboardFeedback, "");
  } catch (error) {
    setFeedback(dashboardFeedback, `Could not load player records: ${error.message}`, true);
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

function playerFromForm(form) {
  const player = Object.fromEntries(new FormData(form).entries());
  delete player.id;
  player.age = Number(player.age);
  return player;
}

if (registrationForm) {
  registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = registrationForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    setFeedback(registrationFeedback, "Submitting your registration…");
    try {
      await apiRequest("/api/players", {
        method: "POST",
        body: JSON.stringify(playerFromForm(registrationForm)),
      });
      registrationForm.reset();
      setFeedback(registrationFeedback, "Thanks for registering! Your details have been saved.");
    } catch (error) {
      setFeedback(registrationFeedback, `We couldn’t save your registration: ${error.message}`, true);
    } finally {
      submitButton.disabled = false;
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = loginForm.querySelector('[type="submit"]');
    const formData = new FormData(loginForm);
    submitButton.disabled = true;
    setFeedback(loginFeedback, "Signing in…");
    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });
      setFeedback(loginFeedback, "");
      setAdminView(true);
      await renderPlayers();
    } catch (error) {
      setFeedback(loginFeedback, error.message, true);
    } finally {
      submitButton.disabled = false;
    }
  });

  document.querySelector("#logout-button").addEventListener("click", async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      setAdminView(false);
      loginForm.reset();
      setFeedback(loginFeedback, "");
      setFeedback(dashboardFeedback, "");
    } catch (error) {
      setFeedback(dashboardFeedback, `Could not sign out: ${error.message}`, true);
    }
  });

  document.querySelector("#new-player-button").addEventListener("click", startNewPlayer);

  document.querySelector("#cancel-edit").addEventListener("click", () => {
    editForm.hidden = true;
  });

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = document.querySelector("#save-player-button");
    const id = editForm.elements.id.value;
    submitButton.disabled = true;
    try {
      await apiRequest(id ? `/api/players/${encodeURIComponent(id)}` : "/api/players", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(playerFromForm(editForm)),
      });
      editForm.hidden = true;
      await renderPlayers();
      setFeedback(dashboardFeedback, id ? "Player changes saved." : "Player added.");
    } catch (error) {
      setFeedback(editFeedback, `Could not save player details: ${error.message}`, true);
    } finally {
      submitButton.disabled = false;
    }
  });

  document.querySelector("#delete-player").addEventListener("click", async () => {
    const id = editForm.elements.id.value;
    const deleteButton = document.querySelector("#delete-player");
    deleteButton.disabled = true;
    try {
      await apiRequest(`/api/players/${encodeURIComponent(id)}`, { method: "DELETE" });
      editForm.hidden = true;
      await renderPlayers();
      setFeedback(dashboardFeedback, "Player deleted.");
    } catch (error) {
      setFeedback(editFeedback, `Could not delete this player: ${error.message}`, true);
    } finally {
      deleteButton.disabled = false;
    }
  });

  apiRequest("/api/auth/session")
    .then(() => {
      setAdminView(true);
      return renderPlayers();
    })
    .catch((error) => {
      setAdminView(false);
      if (error.message !== "Not signed in.") {
        setFeedback(loginFeedback, `Could not connect to the admin service: ${error.message}`, true);
      }
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
