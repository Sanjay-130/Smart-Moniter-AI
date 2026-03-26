import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

const protect = asyncHandler(async (req, res, next) => {
  const userId = req.session && req.session.userId;
  if (!userId) {
    res.status(401);
    throw new Error("Not Authorized, no active session");
  }
  const user = await User.findById(userId).select("-password");
  if (!user) {
    res.status(401);
    throw new Error("Not Authorized, invalid session");
  }
  req.user = user;
  next();
});

// Middleware to check if user is a teacher
const teacherOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "teacher") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied. Teachers only.");
  }
});

// Middleware to check if user is a student
const studentOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "student") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied. Students only.");
  }
});

// Middleware to check if user is admin
const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied. Admins only.");
  }
});

// Middleware to check if user is a teacher or admin
const teacherOrAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied. Teachers or Admins only.");
  }
});

export { protect, teacherOnly, studentOnly, adminOnly, teacherOrAdmin };
