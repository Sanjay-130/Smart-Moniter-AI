import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const User = mongoose.model("User", mongoose.Schema({ profilePic: String, name: String }));

const checkUsers = async () => {
  const uri = process.env.MONGO_URL;
  try {
    await mongoose.connect(uri);
    const users = await User.find({ profilePic: { $ne: '' } });
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
