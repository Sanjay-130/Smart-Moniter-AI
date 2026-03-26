import express from 'express';
import { protect, studentOnly, teacherOrAdmin } from '../middleware/authMiddleware.js';
import { saveResult, getStudentResults, getExamResult, getExamResultsForTeacher } from '../controllers/resultController.js';

const router = express.Router();

router.route('/')
  .post(protect, studentOnly, saveResult);

router.route('/student')
  .get(protect, studentOnly, getStudentResults);

router.route('/exam/:examId')
  .get(protect, getExamResult);

router.route('/teacher/exam/:examId')
  .get(protect, teacherOrAdmin, getExamResultsForTeacher);

export default router;
