import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const testConnect = async () => {
  try {
    const uri = process.env.MONGO_URL?.trim();
    console.log('Attempting to connect with URI (length):', uri?.length);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('SUCCESS: Connected to MongoDB');
    console.log('ReadyState:', mongoose.connection.readyState);
    console.log('Host:', conn.connection.host);
    process.exit(0);
  } catch (error) {
    console.error('ERROR: Connection failed:');
    console.error(error.message);
    process.exit(1);
  }
};

testConnect();
