/**
 * Created by Syed Afzal
 */
const mongoose = require("mongoose");

const RETRY_DELAY_MS = 2000;

const options = {
  autoIndex: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
};

exports.connect = (app) => {
  const connectWithRetry = async () => {
    try {
      console.log("Connecting to MongoDB...");

      await mongoose.connect(process.env.MONGODB_URI, options);

      console.log("MongoDB connected successfully.");

      app.emit("ready");
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);

      setTimeout(connectWithRetry, RETRY_DELAY_MS);
    }
  };

  connectWithRetry();
};

exports.mongoose = mongoose;