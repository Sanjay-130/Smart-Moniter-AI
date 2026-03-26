import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const checkUsers = async () => {
  const uri = process.env.MONGO_URL;
  try {
    await mongoose.connect(uri);
    const users = await mongoose.connection.db.collection('users').find({ profilePic: { $ne: '' } }).toArray();
    console.log(`Found ${users.length} users with profile pics.`);
    users.forEach(u => console.log(`${u.name}: ${u.profilePic}`));
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

checkUsers();
