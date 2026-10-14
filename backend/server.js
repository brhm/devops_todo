/**
 * Created by Syed Afzal
 */
require("./config/config");

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const db = require("./db");

const app = express();

const PORT = Number(process.env.PORT || 3000);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));



app.get("/health", (req, res) => {
  const isConnected = db.mongoose.connection.readyState === 1;

  if (isConnected) {
    return res.status(200).json({
      status: "healthy",
      database: "connected"
    });
  }

  return res.status(503).json({
    status: "unhealthy",
    database: "disconnected"
  });
});


// Routes
require("./routes")(app);

// Start server after MongoDB connection
app.once("ready", () => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Connect to MongoDB
db.connect(app);

module.exports = app;
