import express from "express";

import { protect, teacherOnly, studentOnly } from "../middleware/authMiddleware.js";
import { createExam, getExams, deleteExam, validateExamAccess, updateExamAccessCode } from "../controllers/examController.js";
import {
  createQuestion,
  getQuestionsByExamId,
} from "../controllers/quesController.js";
import {
  getCheatingLogsByExamId,
  saveCheatingLog,
  deleteCheatingLog,
  getMyCheatingLogs,
  getAllCheatingLogs,
} from "../controllers/cheatingLogController.js";
import { createCategory, getCategories, deleteCategory } from "../controllers/categoryController.js";
const examRoutes = express.Router();

// protecting Exam route using auth middleware
examRoutes.route("/").get(protect, getExams).post(protect, teacherOnly, createExam);
examRoutes.route("/:id").delete(protect, teacherOnly, deleteExam);
examRoutes.route("/questions").post(protect, teacherOnly, createQuestion);
examRoutes.route("/questions/:examId").get(protect, getQuestionsByExamId);
// Validate exam access code (student submits password)
examRoutes.route('/:examId/validate-access').post(protect, studentOnly, validateExamAccess);
// Teacher sets/updates the exam password (access code)
examRoutes.route('/:id/access-code').put(protect, teacherOnly, updateExamAccessCode);
// Categories
examRoutes.route('/categories').get(protect, getCategories).post(protect, teacherOnly, createCategory);
examRoutes.route('/categories/:id').delete(protect, teacherOnly, deleteCategory);
examRoutes.route("/my-cheatingLogs").get(protect, studentOnly, getMyCheatingLogs);
examRoutes.route("/cheatingLogs/all").get(protect, getAllCheatingLogs);
examRoutes.route("/cheatingLogs/:examId").get(protect, teacherOnly, getCheatingLogsByExamId);
examRoutes.route("/cheatingLogs").post(protect, studentOnly, saveCheatingLog);
// Allow teacher to delete a cheating log entry by id
examRoutes.route("/cheatingLogs/:id").delete(protect, teacherOnly, deleteCheatingLog);

export default examRoutes;
