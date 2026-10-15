require("./config/config");

const app = require("./app");
const db = require("./db");

const PORT = Number(process.env.PORT || 3000);

// Start HTTP server after MongoDB connection
app.once("ready", () => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Connect to MongoDB
db.connect(app);