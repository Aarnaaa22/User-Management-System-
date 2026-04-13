const mongoose = require("mongoose");

/**
 * Connects to MongoDB Atlas using MONGO_URI from environment variables.
 * Exits the process if connection fails — no point running without a DB.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options suppress deprecation warnings in Mongoose 8+
      // (they are defaults, but explicit is better than implicit)
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Crash fast — don't run without a database
  }
};

module.exports = connectDB;
