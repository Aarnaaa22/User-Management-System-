/**
 * UserBase — Frontend JavaScript
 *
 * Connects to the Express/MongoDB backend via Fetch API.
 * Handles: Create, Read (paginated/sorted/filtered), Update, Delete, Search
 */

// ─── Config ──────────────────────────────────────────────────────────────────
// ✅ Correct
const API_URL = "https://user-management-system-backend-hozd.onrender.com";


// ─── State ────────────────────────────────────────────────────────────────────
let state = {
  page: 1,
  limit: 9,
  sort: "-createdAt",
  totalPages: 1,
  isSearchMode: false,
  minAge: null,
  maxAge: null,
};

// ─── DOM References ───────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const userGrid    = $("userGrid");
const pagination  = $("pagination");
const loadingState = $("loadingState");
const emptyState  = $("emptyState");
const totalCount  = $("totalCount");
const contentTitle = $("contentTitle");
const sortSelect  = $("sortSelect");

// ─── Utility Helpers ──────────────────────────────────────────────────────────

/** Show a toast notification */
function showToast(message, type = "success") {
  const toast = $("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add("hidden"), 3500);
}

/** Show an inline form message */
function showFormMessage(elId, message, type = "error") {
  const el = $(elId);
  el.textContent = message;
  el.className = `form-message ${type}`;
  setTimeout(() => { el.textContent = ""; el.className = "form-message"; }, 4000);
}

/** Format a date string nicely */
function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/** Get the first letter of a name for the avatar */
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Build a URL with query params, filtering out null/undefined values */
function buildURL(base, params) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== "") {
      url.searchParams.set(key, val);
    }
  });
  return url.toString();
}

// ─── Render Functions ─────────────────────────────────────────────────────────

/** Render the user grid from an array of user objects */
function renderUsers(users) {
  userGrid.innerHTML = "";

  if (!users || users.length === 0) {
    loadingState.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  loadingState.classList.add("hidden");

  users.forEach((user, index) => {
    const card = document.createElement("div");
    card.className = "user-card";
    card.style.animationDelay = `${index * 50}ms`;

    const hobbiesHTML =
      user.hobbies && user.hobbies.length > 0
        ? `<div class="card-hobbies">
            ${user.hobbies.map((h) => `<span class="hobby-tag">${h.trim()}</span>`).join("")}
           </div>`
        : "";

    const bioHTML = user.bio
      ? `<p class="card-bio">${user.bio}</p>`
      : "";

    const ageHTML = user.age != null
      ? `<span class="card-age">${user.age} yrs</span>`
      : "";

    card.innerHTML = `
      <div class="card-header">
        <div class="card-avatar">${getInitials(user.name)}</div>
        <div class="card-identity">
          <div class="card-name" title="${user.name}">${user.name}</div>
          <div class="card-email" title="${user.email}">${user.email}</div>
        </div>
        ${ageHTML}
      </div>
      ${bioHTML}
      ${hobbiesHTML}
      <div class="card-date">
        <span>⊙</span>
        <span>${formatDate(user.createdAt)}</span>
      </div>
      <div class="card-footer">
        <button class="btn-card btn-edit" data-id="${user._id}">Edit</button>
        <button class="btn-card btn-delete" data-id="${user._id}">Delete</button>
      </div>
    `;

    card.querySelector(".btn-edit").addEventListener("click", () => openEditModal(user));
    card.querySelector(".btn-delete").addEventListener("click", () => confirmDelete(user._id, user.name));

    userGrid.appendChild(card);
  });
}

/** Render pagination buttons */
function renderPagination(totalPages, currentPage) {
  pagination.innerHTML = "";
  if (totalPages <= 1) return;

  const createBtn = (label, page, disabled = false, active = false) => {
    const btn = document.createElement("button");
    btn.className = `page-btn${active ? " active" : ""}`;
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener("click", () => {
      state.page = page;
      fetchUsers();
    });
    return btn;
  };

  pagination.appendChild(createBtn("←", currentPage - 1, currentPage === 1));

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pagination.appendChild(createBtn(i, i, false, i === currentPage));
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      const dots = document.createElement("span");
      dots.textContent = "…";
      dots.style.cssText = "color: var(--text-muted); padding: 0 0.25rem; line-height: 36px;";
      pagination.appendChild(dots);
    }
  }

  pagination.appendChild(createBtn("→", currentPage + 1, currentPage === totalPages));
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/** Fetch paginated users from the backend */
async function fetchUsers() {
  state.isSearchMode = false;
  contentTitle.textContent = "All Users";
  loadingState.classList.remove("hidden");
  emptyState.classList.add("hidden");
  userGrid.innerHTML = "";
  pagination.innerHTML = "";

  try {
    const url = buildURL(API_BASE, {
      page: state.page,
      limit: state.limit,
      sort: state.sort,
      minAge: state.minAge,
      maxAge: state.maxAge,
    });

    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    renderUsers(data.data);
    renderPagination(data.pagination.totalPages, data.pagination.page);
    state.totalPages = data.pagination.totalPages;

    // Update header stat
    const numEl = totalCount.querySelector(".stat-number");
    numEl.textContent = data.pagination.total;

  } catch (err) {
    loadingState.classList.add("hidden");
    showToast("Failed to fetch users: " + err.message, "error");
  }
}

/** Search users by bio text */
async function searchUsers() {
  const q = $("searchQuery").value.trim();
  if (!q) { showToast("Please enter a search term", "error"); return; }

  state.isSearchMode = true;
  contentTitle.textContent = `Search: "${q}"`;
  loadingState.classList.remove("hidden");
  emptyState.classList.add("hidden");
  userGrid.innerHTML = "";
  pagination.innerHTML = "";

  try {
    const url = buildURL(`${API_BASE}/search`, { q });
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    renderUsers(data.data);

    const numEl = totalCount.querySelector(".stat-number");
    numEl.textContent = data.count;

  } catch (err) {
    loadingState.classList.add("hidden");
    showToast("Search failed: " + err.message, "error");
  }
}

/** Create a new user */
async function createUser() {
  const name    = $("name").value.trim();
  const email   = $("email").value.trim();
  const age     = $("age").value;
  const hobbies = $("hobbies").value.trim();
  const bio     = $("bio").value.trim();

  if (!name || !email) {
    showFormMessage("formMessage", "Name and Email are required.");
    return;
  }

  const payload = {
    name,
    email,
    bio,
    ...(age !== "" && { age: Number(age) }),
    ...(hobbies !== "" && { hobbies: hobbies.split(",").map((h) => h.trim()).filter(Boolean) }),
  };

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    // Clear form
    ["name", "email", "age", "hobbies", "bio"].forEach((id) => { $(id).value = ""; });

    showToast(`✓ ${data.data.name} created successfully!`);
    state.page = 1;
    fetchUsers();

  } catch (err) {
    showFormMessage("formMessage", err.message);
  }
}

/** Delete user after confirmation */
async function confirmDelete(id, name) {
  if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    showToast(`${name} deleted.`);
    if (state.isSearchMode) {
      searchUsers();
    } else {
      fetchUsers();
    }

  } catch (err) {
    showToast("Delete failed: " + err.message, "error");
  }
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function openEditModal(user) {
  $("editId").value     = user._id;
  $("editName").value   = user.name || "";
  $("editEmail").value  = user.email || "";
  $("editAge").value    = user.age != null ? user.age : "";
  $("editBio").value    = user.bio || "";
  $("editHobbies").value = user.hobbies ? user.hobbies.join(", ") : "";

  $("modalOverlay").classList.remove("hidden");
}

function closeEditModal() {
  $("modalOverlay").classList.add("hidden");
  $("editMessage").textContent = "";
}

async function saveEdit() {
  const id      = $("editId").value;
  const name    = $("editName").value.trim();
  const email   = $("editEmail").value.trim();
  const age     = $("editAge").value;
  const hobbies = $("editHobbies").value.trim();
  const bio     = $("editBio").value.trim();

  if (!name || !email) {
    showFormMessage("editMessage", "Name and Email are required.");
    return;
  }

  const payload = {
    name,
    email,
    bio,
    ...(age !== "" && { age: Number(age) }),
    hobbies: hobbies ? hobbies.split(",").map((h) => h.trim()).filter(Boolean) : [],
  };

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    showToast(`✓ ${data.data.name} updated!`);
    closeEditModal();
    if (state.isSearchMode) {
      searchUsers();
    } else {
      fetchUsers();
    }

  } catch (err) {
    showFormMessage("editMessage", err.message);
  }
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

// Create button
$("createBtn").addEventListener("click", createUser);

// Search
$("searchBtn").addEventListener("click", searchUsers);
$("searchQuery").addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchUsers();
});

// Clear search
$("clearSearchBtn").addEventListener("click", () => {
  $("searchQuery").value = "";
  state.page = 1;
  state.minAge = null;
  state.maxAge = null;
  fetchUsers();
});

// Sort
sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  state.page = 1;
  fetchUsers();
});

// Age filter
$("filterBtn").addEventListener("click", () => {
  const min = $("minAge").value;
  const max = $("maxAge").value;
  state.minAge = min !== "" ? Number(min) : null;
  state.maxAge = max !== "" ? Number(max) : null;
  state.page = 1;
  fetchUsers();
});

// Modal
$("modalClose").addEventListener("click", closeEditModal);
$("cancelEditBtn").addEventListener("click", closeEditModal);
$("saveEditBtn").addEventListener("click", saveEdit);
$("modalOverlay").addEventListener("click", (e) => {
  if (e.target === $("modalOverlay")) closeEditModal();
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeEditModal();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchUsers();
