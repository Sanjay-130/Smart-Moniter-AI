import Result from '../models/resultModel.js';
import Exam from '../models/examModel.js';
import Question from '../models/quesModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Save exam result
// @route   POST /api/results
// @access  Private/Student
export const saveResult = asyncHandler(async (req, res) => {
  const { examId, answers, timeTaken } = req.body;
  const studentId = req.user._id;

  // Get the exam
  const exam = await Exam.findById(examId);

  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  // Get relevant questions
  const examQuestions = await Question.find({ examId: examId });

  // Calculate score and prepare result
  let totalScore = 0;
  let maxPossibleScore = 0;
  const resultDetails = [];

  examQuestions.forEach(question => {
    const qMarks = question.marks || 1;
    maxPossibleScore += qMarks;
    const qIdStr = question._id.toString();
    const studentAnswer = answers.find(a => String(a.questionId) === qIdStr);
    
    let isCorrect = false;
    let earnedMarks = 0;
    let passedTestCases = 0;
    let totalTestCases = 0;
    let resultDetail = {
      questionId: question._id,
      isCorrect: false
    };

    if (question.questionType === 'CODE') {
      if (studentAnswer) {
        resultDetail.codeAnswer = studentAnswer.codeAnswer || '';
        resultDetail.language = studentAnswer.language || '';
        passedTestCases = studentAnswer.passedTestCases || 0;
        totalTestCases = studentAnswer.totalTestCases || (question.codeQuestion?.testCases?.length || 0);
        
        if (totalTestCases > 0) {
          earnedMarks = (passedTestCases / totalTestCases) * qMarks;
          isCorrect = passedTestCases === totalTestCases;
        } else {
          isCorrect = !!studentAnswer.isCorrect;
          if (isCorrect) earnedMarks = qMarks;
        }
        
        resultDetail.passedTestCases = passedTestCases;
        resultDetail.totalTestCases = totalTestCases;
      }
    } else {
      // MCQ Logic
      const correctOpt = question.options && question.options.find(opt => opt.isCorrect);
      if (studentAnswer && correctOpt) {
        isCorrect = String(studentAnswer.selectedOption) === correctOpt._id.toString();
        if (isCorrect) earnedMarks = qMarks;
      }
      resultDetail.selectedOption = studentAnswer ? studentAnswer.selectedOption : 'Not answered';
    }

    resultDetail.isCorrect = isCorrect;
    totalScore += earnedMarks;
    resultDetails.push(resultDetail);
  });

  const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  const status = percentage >= 50 ? 'Passed' : 'Failed';

  // Create or update the result
  const result = await Result.findOneAndUpdate(
    { student: studentId, exam: examId },
    {
      student: studentId,
      exam: examId,
      answers: resultDetails,
      score: totalScore,
      maxScore: maxPossibleScore,
      totalQuestions: exam.questions.length,
      percentage,
      timeTaken,
      status
    },
    { new: true, upsert: true }
  );

  res.status(201).json(result);
});

// @desc    Get student's results
// @route   GET /api/results/student
// @access  Private/Student
export const getStudentResults = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const results = await Result.find({ student: studentId })
    // populate exam and its category name so frontend can display category
    .populate({
      path: 'exam',
      select: 'examName totalQuestions duration category',
      populate: { path: 'category', select: 'name' },
    })
    .sort({ submittedAt: -1 });

  // Transform results to include flat exam fields for easier frontend access
  const transformedResults = results.map(result => {
    const resultObj = result.toObject();
    return {
      ...resultObj,
      examId: resultObj.exam?._id || resultObj.exam,
      examName: resultObj.exam?.examName || 'Unnamed Exam',
      examDuration: resultObj.exam?.duration,
      examTotalQuestions: resultObj.exam?.totalQuestions,
      examCategoryName: resultObj.exam?.category?.name || 'Uncategorized',
    };
  });

  res.json(transformedResults);
});

// @desc    Get result for a specific exam
// @route   GET /api/results/exam/:examId
// @access  Private
export const getExamResult = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const studentId = req.user._id;

  const result = await Result.findOne({
    student: studentId,
    exam: examId
  })
    .populate({
      path: 'exam',
      select: 'examName totalQuestions duration category',
      populate: { path: 'category', select: 'name' },
    })
    .populate('answers.questionId', 'questionText options correctOption');

  if (!result) {
    res.status(404);
    throw new Error('Result not found');
  }

  res.json(result);
});

// @desc    Get all student results for a specific exam (Teacher only)
// @route   GET /api/results/teacher/exam/:examId
// @access  Private/Teacher
export const getExamResultsForTeacher = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const exam = await Exam.findById(examId);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  // Get all results for this exam
  const results = await Result.find({ exam: examId })
    .populate('student', 'name email rollNumber profilePic')
    .populate('answers.questionId', 'questionText options correctOption questionType codeQuestion')
    .sort({ submittedAt: -1 });

  res.json({
    examName: exam.examName,
    totalQuestions: exam.totalQuestions,
    duration: exam.duration,
    results
  });
});
