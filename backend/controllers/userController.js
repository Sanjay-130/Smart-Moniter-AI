import asyncHandler from "express-async-handler";
import User from "./../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import CheatingLog from "../models/cheatingLogModel.js";
import Exam from "../models/examModel.js";
import Category from "../models/categoryModel.js";
import mongoose from "mongoose";
import UserActionLog from "../models/userActionLogModel.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const authUser = asyncHandler(async (req, res) => {
  // Authenticate using rollNumber OR email + password.
  const { rollNumber, email, password } = req.body;

  let user = null;
  if (rollNumber) {
    user = await User.findOne({ rollNumber });
  }
  // fallback to email if rollNumber wasn't provided or not found
  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (user && (await user.matchPassword(password))) {
    // if student is blocked, prevent login
    if (user.role === 'student' && user.isBlocked) {
      res.status(403);
      throw new Error(
        'Your account is blocked due to malpractice. Please contact your teacher to get unblocked.'
      );
    }
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      dob: user.dob,
      profilePic: user.profilePic,
      role: user.role,
      password_encrypted: user.password,
      isBlocked: user.isBlocked,
      malpracticeCount: user.malpracticeCount,
      message: "User successfully logged in with role: " + user.role,
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials (roll number/email or password)");
  }
});

// Teacher-only: full student history (cheating logs + action logs + summary)
const getStudentHistory = asyncHandler(async (req, res) => {
  const { email, rollNumber } = req.query || {};

  if (!email && !rollNumber) {
    res.status(400);
    throw new Error('Provide email or rollNumber to lookup history');
  }

  const query = email ? { email } : { rollNumber };
  const user = await User.findOne(query).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role !== 'student') {
    res.status(400);
    throw new Error('Only students can be looked up');
  }

  const rn = user.rollNumber;
  const cheatingLogs = await CheatingLog.find({
    $or: [
      { rollNumber: rn },
      ...(user.email ? [{ email: user.email }] : []),
    ],
  })
    .sort({ createdAt: -1 })
    .lean();

  // Resolve exam names for display; logs may store custom examId (uuid) OR Exam _id
  const rawExamRefs = [...new Set(cheatingLogs.map((l) => l.examId).filter(Boolean))];
  let examNameMap = {};
  let examCategoryIdMap = {};
  if (rawExamRefs.length) {
    const objectIdRefs = rawExamRefs.filter((x) => mongoose.Types.ObjectId.isValid(String(x))).map((x) => new mongoose.Types.ObjectId(String(x)));
    const nonObjectIdRefs = rawExamRefs.filter((x) => !mongoose.Types.ObjectId.isValid(String(x)));

    const examsByUuid = nonObjectIdRefs.length
      ? await Exam.find({ examId: { $in: nonObjectIdRefs } }).select('examId examName category').lean()
      : [];
    const examsByObjectId = objectIdRefs.length
      ? await Exam.find({ _id: { $in: objectIdRefs } }).select('_id examId examName category').lean()
      : [];

    const allExams = [...examsByUuid, ...examsByObjectId];
    for (const e of allExams) {
      if (e.examId) {
        examNameMap[e.examId] = e.examName;
        examCategoryIdMap[e.examId] = e.category ? String(e.category) : undefined;
      }
      if (e._id) {
        const key = String(e._id);
        examNameMap[key] = e.examName;
        examCategoryIdMap[key] = e.category ? String(e.category) : undefined;
      }
    }

    const categoryIds = [...new Set(Object.values(examCategoryIdMap).filter(Boolean))];
    const categories = categoryIds.length
      ? await Category.find({ _id: { $in: categoryIds } }).select('name').lean()
      : [];
    const categoryNameMap = Object.fromEntries(categories.map((c) => [String(c._id), c.name]));

    var cheatingLogsWithNames = cheatingLogs.map((l) => {
      const ref = String(l.examId);
      const catId = examCategoryIdMap[ref];
      return {
        ...l,
        examName: examNameMap[ref] || undefined,
        categoryName: catId ? categoryNameMap[catId] : undefined,
      };
    });
  } else {
    var cheatingLogsWithNames = cheatingLogs.map((l) => ({ ...l }));
  }

  const actionLogs = await UserActionLog.find({ rollNumber: rn })
    .sort({ createdAt: -1 })
    .lean();

  const summary = cheatingLogsWithNames.reduce(
    (acc, l) => {
      acc.noFaceCount += l.noFaceCount || 0;
      acc.multipleFaceCount += l.multipleFaceCount || 0;
      acc.cellPhoneCount += l.cellPhoneCount || 0;
      acc.prohibitedObjectCount += l.prohibitedObjectCount || 0;
      acc.leaningBackCount += l.leaningBackCount || 0;
      acc.events += 1;
      return acc;
    },
    { noFaceCount: 0, multipleFaceCount: 0, cellPhoneCount: 0, prohibitedObjectCount: 0, leaningBackCount: 0, events: 0 }
  );

  res.status(200).json({
    student: {
      _id: user._id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      malpracticeCount: user.malpracticeCount,
      isBlocked: user.isBlocked,
    },
    summary,
    actionLogs,
    cheatingLogs: cheatingLogsWithNames,
  });
});

// Teacher-only: block a student by email or rollNumber
const blockUser = asyncHandler(async (req, res) => {
  const { email, rollNumber } = req.body || {};

  if (!email && !rollNumber) {
    res.status(400);
    throw new Error('Provide email or rollNumber to block');
  }

  const query = email ? { email } : { rollNumber };
  const user = await User.findOne(query);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role !== 'student') {
    res.status(400);
    throw new Error('Only students can be blocked');
  }

  user.isBlocked = true;
  await user.save();

  try {
    await UserActionLog.create({
      userId: user._id,
      rollNumber: user.rollNumber,
      action: 'BLOCK',
    });
  } catch (e) { }

  res.status(200).json({
    message: 'User blocked successfully',
    _id: user._id,
    email: user.email,
    rollNumber: user.rollNumber,
    malpracticeCount: user.malpracticeCount,
    isBlocked: user.isBlocked,
  });
});

const registerUser = asyncHandler(async (req, res) => {
  // Students: require rollNumber, email optional
  // Teachers: require email, rollNumber optional
  const { name, email, password, role, rollNumber, dob } = req.body;

  if (role === 'student') {
    if (!rollNumber) {
      res.status(400);
      throw new Error('rollNumber is required for student registration');
    }
    const userExistByRoll = await User.findOne({ rollNumber });
    if (userExistByRoll) {
      res.status(400);
      throw new Error('User with this roll number already exists');
    }
  }

  if (email) {
    const userExistByEmail = await User.findOne({ email });
    if (userExistByEmail) {
      res.status(400);
      throw new Error('User with this email already exists');
    }
  } else if (role === 'teacher') {
    // teacher must provide an email
    res.status(400);
    throw new Error('Email is required for teacher registration');
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    rollNumber,
    dob,
    profilePic: req.body.profilePic || '',
  });

  if (user) {
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      dob: user.dob,
      profilePic: user.profilePic,
      role: user.role,
      password_encrypted: user.password,
      isBlocked: user.isBlocked,
      malpracticeCount: user.malpracticeCount,
      message: 'User successfully created with role: ' + user.role,
    });
  } else {
    res.status(400);
    throw new Error('Invalid User Data');
  }
});

const logoutUser = asyncHandler(async (req, res, next) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout session destroy failed:", err);
        // Continue to clear cookie even if destroy failed
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: "User logged out" });
    });
  } else {
    res.status(200).json({ message: "User logged out" });
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    rollNumber: req.user.rollNumber,
    dob: req.user.dob,
    profilePic: req.user.profilePic,
    role: req.user.role,
    createdAt: req.user.createdAt,
    isBlocked: req.user.isBlocked,
    malpracticeCount: req.user.malpracticeCount,
  };
  res.status(200).json(user);
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.dob = req.body.dob || user.dob;
    user.profilePic = req.body.profilePic !== undefined ? req.body.profilePic : user.profilePic;
    // allow updating rollNumber but ensure uniqueness
    if (req.body.rollNumber && req.body.rollNumber !== user.rollNumber) {
      const exists = await User.findOne({ rollNumber: req.body.rollNumber });
      if (exists) {
        res.status(400);
        throw new Error("rollNumber already in use");
      }
      user.rollNumber = req.body.rollNumber;
    }
    user.role = req.body.role || user.role;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      dob: updatedUser.dob,
      profilePic: updatedUser.profilePic,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      isBlocked: updatedUser.isBlocked,
      malpracticeCount: updatedUser.malpracticeCount,
    });
  } else {
    res.status(404);
    throw new Error("User Not Found");
  }
});

// Admin: get all users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.status(200).json(users);
});

// Admin: delete a user
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await User.findByIdAndDelete(userId);
  res.status(200).json({ message: 'User deleted successfully' });
});

// Teacher-only: fetch a student's info by email or rollNumber
const getStudentByIdentifier = asyncHandler(async (req, res) => {
  const { email, rollNumber } = req.query || {};

  if (!email && !rollNumber) {
    res.status(400);
    throw new Error('Provide email or rollNumber to lookup');
  }

  const query = email ? { email } : { rollNumber };
  const user = await User.findOne(query).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role !== 'student') {
    res.status(400);
    throw new Error('Only students can be looked up');
  }

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    rollNumber: user.rollNumber,
    malpracticeCount: user.malpracticeCount,
    isBlocked: user.isBlocked,
  });
});

// Teacher-only: unblock a student and optionally reset malpracticeCount
const unblockUser = asyncHandler(async (req, res) => {
  const { email, rollNumber, resetCount = true } = req.body || {};

  if (!email && !rollNumber) {
    res.status(400);
    throw new Error('Provide email or rollNumber to unblock');
  }

  const query = email ? { email } : { rollNumber };
  const user = await User.findOne(query);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role !== 'student') {
    res.status(400);
    throw new Error('Only students can be unblocked');
  }

  user.isBlocked = false;
  if (resetCount) user.malpracticeCount = 0;
  await user.save();

  try {
    await UserActionLog.create({
      userId: user._id,
      rollNumber: user.rollNumber,
      action: 'UNBLOCK',
      metadata: { resetCount },
    });
  } catch (e) { }

  res.status(200).json({
    message: 'User unblocked successfully',
    _id: user._id,
    email: user.email,
    rollNumber: user.rollNumber,
    malpracticeCount: user.malpracticeCount,
    isBlocked: user.isBlocked,
  });
});

// Public: Forgot password - send OTP to email
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, rollNumber } = req.body;

  if (!email && !rollNumber) {
    res.status(400);
    throw new Error('Please provide email or roll number');
  }

  const query = email ? { email } : { rollNumber };
  const user = await User.findOne(query);

  if (!user) {
    res.status(404);
    throw new Error('User not found with provided credentials');
  }

  if (!user.email) {
    res.status(400);
    throw new Error('No email associated with this account. Please contact support.');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordOTP = otp;
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins

  await user.save();

  const message = `Your password reset OTP for Smart Monitor AI is: ${otp}. It will expire in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
      <h2 style="color: #1A237E;">Password Reset OTP</h2>
      <p>Hello ${user.name || 'User'},</p>
      <p>We received a request to reset your password. Use the following 6-digit OTP to proceed:</p>
      <div style="font-size: 24px; font-weight: bold; color: #0D47A1; margin: 20px 0; letter-spacing: 5px;">${otp}</div>
      <p>This code will expire in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 12px; color: #777;">Secure Exam Proctoring Team • Smart Monitor AI</p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP - Smart Monitor AI',
      message,
      html
    });

    res.status(200).json({ message: 'OTP sent to registered email' });
  } catch (err) {
    console.error('Email sending failed:', err);
    try {
      fs.appendFileSync('debug.log', `${new Date().toISOString()} - Forgot Password Error: ${err.message}\n${err.stack}\n`);
    } catch (fsErr) { }
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(500);
    throw new Error('Email could not be sent. Please try again later.');
  }
});

// Public: Reset password using OTP
const resetPassword = asyncHandler(async (req, res) => {
  const { otp, newPassword, email, rollNumber } = req.body;

  if (!otp || !newPassword) {
    res.status(400);
    throw new Error('Please provide OTP and new password');
  }

  const query = email ? { email } : { rollNumber };
  const user = await User.findOne({
    ...query,
    resetPasswordOTP: otp,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  try {
    await UserActionLog.create({
      userId: user._id,
      rollNumber: user.rollNumber,
      action: 'PASSWORD_RESET',
    });
  } catch (e) { }

  res.status(200).json({ message: 'Password reset successful. You can now login with your new password.' });
});

// Admin: Bulk register users (from CSV or manual list)
const bulkRegister = asyncHandler(async (req, res) => {
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of users');
  }

  const results = {
    success: [],
    errors: [],
  };

  for (const userData of users) {
    const { name, email, password, role, rollNumber, dob } = userData;

    try {
      // Basic validation
      if (!name || !password || !role) {
        throw new Error(`Missing required fields for user: ${name || 'Unknown'}`);
      }

      if (role === 'student' && !rollNumber) {
        throw new Error(`Roll number is required for student: ${name}`);
      }

      if (role === 'teacher' && !email) {
        throw new Error(`Email is required for teacher: ${name}`);
      }

      // Check existence
      if (rollNumber) {
        const exist = await User.findOne({ rollNumber });
        if (exist) throw new Error(`User with roll number ${rollNumber} already exists`);
      }

      if (email) {
        const exist = await User.findOne({ email });
        if (exist) throw new Error(`User with email ${email} already exists`);
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role,
        rollNumber,
        dob,
        profilePic: userData.profilePic || '',
      });

      results.success.push({ name: user.name, role: user.role });
    } catch (err) {
      results.errors.push({ name: userData.name || 'Unknown', error: err.message });
    }
  }

  res.status(201).json({
    message: `Processed ${users.length} users. Success: ${results.success.length}, Errors: ${results.errors.length}`,
    ...results,
  });
});

export {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  unblockUser,
  blockUser,
  getAllUsers,
  deleteUser,
  getStudentByIdentifier,
  getStudentHistory,
  forgotPassword,
  resetPassword,
  bulkRegister,
};
