require("dotenv").config(); // Must be first — loads .env before anything else

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");
const errorMiddleware = require("./middleware/error.middleware");

// ─── Connect to Database ─────────────────────────────────────────────────────
connectDB();

// ─── App Setup ───────────────────────────────────────────────────────────────
const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

// Allow requests from the frontend (all origins in dev; restrict in production)
app.use(cors({
  origin: "https://user-management-system-blush-mu.vercel.app"
}));
// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/users", userRoutes);

// Health-check endpoint — useful for deployment platforms
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler — catches any route not matched above
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered AFTER all routes
app.use(errorMiddleware);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
});
