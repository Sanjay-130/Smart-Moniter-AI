import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const checkFirstUser = async () => {
  const uri = process.env.MONGO_URL;
  try {
    await mongoose.connect(uri);
    const user = await mongoose.connection.db.collection('users').findOne({});
    console.log(JSON.stringify(user, null, 2));
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

checkFirstUser();
