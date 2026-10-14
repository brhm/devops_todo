const env = process.env.NODE_ENV || "development";

if (env === "development" || env === "test") {
  const config = require("./config.json");
  const envConfig = config[env] || {};

  Object.entries(envConfig).forEach(([key, value]) => {
    if (process.env[key] === undefined) {
      process.env[key] = String(value);
    }
  });
}

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}