const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

/**
 * User Schema
 * Includes validation, defaults, and MongoDB index declarations.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters long"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please provide a valid email address",
      ],
    },

    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
      max: [120, "Age cannot exceed 120"],
    },

    hobbies: {
      type: [String],
      default: [],
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    // Used for hashed index — great for equality lookups (e.g. sharding keys)
    userId: {
      type: String,
      unique: true,
      default: () => uuidv4(), // auto-generate a UUID if not provided
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Disable the automatic __v versioning field (keeps documents cleaner)
    versionKey: false,
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────

/**
 * TEXT INDEX on `bio`
 * Enables full-text search via $text operator.
 * Usage: User.find({ $text: { $search: "photography" } })
 */
userSchema.index({ bio: "text" }, { name: "bio_text_index" });

/**
 * HASHED INDEX on `userId`
 * Useful for sharding and fast equality lookups.
 * NOTE: Hashed indexes do NOT support range queries.
 */
userSchema.index({ userId: "hashed" }, { name: "userId_hashed_index" });

/**
 * TTL INDEX on `createdAt`
 * MongoDB will automatically delete documents 7 days after creation.
 * expireAfterSeconds = 7 * 24 * 60 * 60 = 604800
 *
 * ⚠️  For a real production system, remove this or set a longer TTL.
 *     It's included here to satisfy the project requirements.
 */
userSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 604800, name: "createdAt_ttl_index" }
);

const User = mongoose.model("User", userSchema);

module.exports = User;