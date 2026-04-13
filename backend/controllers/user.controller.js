const User = require("../models/user.model");

// ─── CREATE USER ────────────────────────────────────────────────────────────

/**
 * POST /api/users
 * Creates a new user. Mongoose validation runs automatically.
 */
const createUser = async (req, res, next) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: savedUser,
    });
  } catch (error) {
    next(error); // Pass to error middleware
  }
};

// ─── GET ALL USERS ──────────────────────────────────────────────────────────

/**
 * GET /api/users
 * Returns a paginated, sorted, optionally filtered list of users.
 *
 * Query params:
 *   page    (default: 1)   – Page number
 *   limit   (default: 10)  – Results per page
 *   sort    (default: -createdAt) – Field to sort by, prefix - for descending
 *   age     – Filter by exact age
 *   minAge  – Filter users with age >= minAge
 *   maxAge  – Filter users with age <= maxAge
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "-createdAt";

    // Build filter object
    const filter = {};

    if (req.query.age !== undefined) {
      filter.age = parseInt(req.query.age);
    }

    if (req.query.minAge !== undefined || req.query.maxAge !== undefined) {
      filter.age = {};
      if (req.query.minAge) filter.age.$gte = parseInt(req.query.minAge);
      if (req.query.maxAge) filter.age.$lte = parseInt(req.query.maxAge);
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── SEARCH USERS ───────────────────────────────────────────────────────────

/**
 * GET /api/users/search
 * Uses MongoDB's $text operator against the text index on `bio`.
 *
 * Query params:
 *   q – Search term (required)
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query `q` is required",
      });
    }

    // $text search uses the text index on `bio`
    // textScore is added so we can sort by relevance
    const users = await User.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });

    res.status(200).json({
      success: true,
      count: users.length,
      query: q,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE USER ────────────────────────────────────────────────────────────

/**
 * PUT /api/users/:id
 * Updates a user by Mongoose _id.
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,          // Return the updated document
        runValidators: true, // Re-run schema validators on update
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with id ${req.params.id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE USER ────────────────────────────────────────────────────────────

/**
 * DELETE /api/users/:id
 * Deletes a user by Mongoose _id.
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with id ${req.params.id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

// ─── EXPLAIN QUERY PERFORMANCE ──────────────────────────────────────────────

/**
 * GET /api/users/explain
 * Demonstrates executionStats for a sample query using the text index.
 * Useful for academic/portfolio purposes to show index usage.
 */
const explainQuery = async (req, res, next) => {
  try {
    const stats = await User.find({ $text: { $search: "developer" } })
      .explain("executionStats");

    res.status(200).json({
      success: true,
      message: "Execution stats for text index query on `bio`",
      executionStats: stats.executionStats,
      queryPlanner: stats.queryPlanner,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  searchUsers,
  updateUser,
  deleteUser,
  explainQuery,
};