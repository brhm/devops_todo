const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const db = require("./db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Health endpoint
app.get("/health", (req, res) => {
  const isConnected = db.mongoose.connection.readyState === 1;

  if (isConnected) {
    return res.status(200).json({
      status: "healthy",
      database: "connected",
    });
  }

  return res.status(503).json({
    status: "unhealthy",
    database: "disconnected",
  });
});

// API routes
require("./routes")(app);

module.exports = app;