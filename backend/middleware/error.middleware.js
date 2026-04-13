/**
 * Global Error Handling Middleware
 *
 * Express calls this middleware whenever next(error) is called,
 * or when an unhandled error is thrown inside a route handler.
 *
 * It must have EXACTLY 4 parameters: (err, req, res, next)
 * so Express recognises it as an error handler.
 */
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // ── Mongoose Validation Error (e.g., required field missing, minlength) ──
  if (err.name === "ValidationError") {
    statusCode = 400;
    // Collect all field-level error messages into a single string
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // ── Mongoose Duplicate Key Error (e.g., duplicate email or userId) ──
  if (err.code === 11000) {
    statusCode = 409; // 409 Conflict
    const field = Object.keys(err.keyValue)[0];
    message = `A user with this ${field} already exists`;
  }

  // ── Mongoose CastError (e.g., invalid ObjectId format) ──
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // Log the error server-side (in production, pipe this to a logger like Winston)
  if (statusCode === 500) {
    console.error("🔴 Server Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose the stack trace in development — never in production
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;