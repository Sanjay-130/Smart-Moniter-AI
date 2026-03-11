import express from "express";
const userRoutes = express.Router();
import {
  authUser,
  getUserProfile,
  logoutUser,
  registerUser,
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
} from "../controllers/userController.js";
import { protect, adminOnly, teacherOnly } from "../middleware/authMiddleware.js";
import { saveCheatingLog } from "../controllers/cheatingLogController.js";

// Public routes
userRoutes.post("/", registerUser);
userRoutes.post("/auth", authUser);
userRoutes.post("/logout", logoutUser);
userRoutes.post("/forgot-password", forgotPassword);
userRoutes.post("/reset-password", resetPassword);

// Admin routes - protected
userRoutes.get('/all', protect, adminOnly, getAllUsers);
userRoutes.post('/bulk-register', protect, adminOnly, bulkRegister);
userRoutes.delete('/:id', protect, adminOnly, deleteUser);

// cheating logs
userRoutes.post('/cheatingLogs', protect, saveCheatingLog);

// teacher/admin unblock endpoint
userRoutes.post('/unblock', protect, unblockUser);

// teacher-only block endpoint
userRoutes.post('/block', protect, teacherOnly, blockUser);

// teacher-only: lookup student by email/rollNumber
userRoutes.get('/student', protect, teacherOnly, getStudentByIdentifier);

// teacher/admin: student's full history
userRoutes.get('/student/history', protect, getStudentHistory);

// protecting profile route using auth middleware protect
userRoutes
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default userRoutes;
