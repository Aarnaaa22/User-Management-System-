const express = require("express");
const router = express.Router();
const {
  createUser,
  getAllUsers,
  searchUsers,
  updateUser,
  deleteUser,
  explainQuery,
} = require("../controllers/user.controller");

// ─── Routes ─────────────────────────────────────────────────────────────────
// IMPORTANT: /search and /explain must be declared BEFORE /:id
// Otherwise Express will try to match "search" as an :id param.

// GET  /api/users/search  → search by bio text index
router.get("/search", searchUsers);

// GET  /api/users/explain → show query execution stats
router.get("/explain", explainQuery);

// GET  /api/users         → get all users (pagination + sorting + filtering)
router.get("/", getAllUsers);

// POST /api/users         → create a new user
router.post("/", createUser);

// PUT  /api/users/:id     → update a user
router.put("/:id", updateUser);

// DELETE /api/users/:id  → delete a user
router.delete("/:id", deleteUser);

module.exports = router;