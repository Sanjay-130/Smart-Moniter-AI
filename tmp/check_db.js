import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const checkDB = async () => {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.error("MONGO_URL not found in .env");
    process.exit(1);
  }
  console.log(`Connecting to: ${uri.split('@')[1]}`); // Mask credentials
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("SUCCESS: MongoDB is connected to Atlas.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("FAILURE: MongoDB connection failed.");
    console.error(err.message);
    process.exit(1);
  }
};

checkDB();
