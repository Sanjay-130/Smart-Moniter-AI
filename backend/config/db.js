import mongoose from "mongoose";

const connectDB = async () => {
  const MAX_RETRIES = 5;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const uri = process.env.MONGO_URL?.trim();
      if (!uri) {
        throw new Error("MONGO_URL not defined in .env");
      }
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 20000, 
        socketTimeoutMS: 45000,
        // family: 4, // Removed IPv4 constraint to allow system default resolution
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed: ${error.message}`);
      if (retries >= MAX_RETRIES) {
        console.error("Max retries reached. Server started without DB connection. Check your Atlas IP Whitelist or connection string.");
        return;
      }
      console.log("Retrying in 5 seconds...");
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};

export default connectDB;
