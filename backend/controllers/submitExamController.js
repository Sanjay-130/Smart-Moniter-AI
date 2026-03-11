import asyncHandler from 'express-async-handler';
import Exam from '../models/examModel.js';
import Result from '../models/resultModel.js';
import Question from '../models/quesModel.js';

// @desc    Submit exam answers
// @route   POST /api/exams/submit
// @access  Private/Student
export const submitExam = asyncHandler(async (req, res) => {
  const { examId, answers, timeTaken } = req.body;
  const studentId = req.user._id;

  // Get the exam
  const exam = await Exam.findById(examId);

  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  // Fetch questions that belong to this exam. Questions store examId as a string.
  const examQuestions = await Question.find({ examId: examId });

  if (!examQuestions || examQuestions.length === 0) {
    res.status(404);
    throw new Error('No questions found for this exam');
  }

  // Calculate score and prepare result
  let totalScore = 0;
  let maxPossibleScore = 0;
  const resultDetails = [];

  console.log(`Submitting exam ${examId} for student ${studentId}`);
  // console.log('Received answers:', JSON.stringify(answers, null, 2));

  for (const question of examQuestions) {
    const qMarks = question.marks || 1;
    maxPossibleScore += qMarks;

    // Find student answer - matching string IDs
    const qIdStr = question._id.toString();
    const studentAnswer = answers.find(a => String(a.questionId) === qIdStr);
    
    // Determine the correct option for MCQs
    const correctOption = question.options.find((opt) => opt.isCorrect);
    const correctOptionId = correctOption ? correctOption._id.toString() : null;

    const selectedOption = studentAnswer && studentAnswer.selectedOption ? String(studentAnswer.selectedOption) : '';
    
    let isCorrect = false;
    let earnedMarks = 0;
    let passedTestCases = 0;
    let totalTestCases = 0;

    if (question.questionType === 'MCQ') {
      isCorrect = Boolean(selectedOption && correctOptionId && selectedOption === correctOptionId);
      if (isCorrect) earnedMarks = qMarks;
    } else if (question.questionType === 'CODE') {
      passedTestCases = studentAnswer?.passedTestCases || 0;
      // Use test cases from answer if provided, else from question
      totalTestCases = studentAnswer?.totalTestCases || (question.codeQuestion?.testCases?.length || 0);
      
      if (totalTestCases > 0) {
        earnedMarks = (passedTestCases / totalTestCases) * qMarks;
        isCorrect = passedTestCases === totalTestCases;
      } else {
        // Fallback if no test cases defined
        isCorrect = !!studentAnswer?.isCorrect;
        if (isCorrect) earnedMarks = qMarks;
      }
    }

    totalScore += earnedMarks;

    resultDetails.push({
      questionId: question._id,
      selectedOption,
      codeAnswer: studentAnswer?.codeAnswer || '',
      language: studentAnswer?.language || '',
      passedTestCases,
      totalTestCases,
      isCorrect
    });
  }

  const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  const status = percentage >= 50 ? 'Passed' : 'Failed';

  // Create or update the result
  // Use the exam document's ObjectId when saving the result to match the Result schema
  const result = await Result.findOneAndUpdate(
    { student: studentId, exam: exam._id },
    {
      student: studentId,
      exam: exam._id,
      answers: resultDetails,
      score: totalScore,
      maxScore: maxPossibleScore,
      totalQuestions: examQuestions.length,
      percentage: parseFloat(percentage.toFixed(2)),
      timeTaken,
      status,
      submittedAt: new Date()
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Populate exam details in the response
  const populatedResult = await Result.findById(result._id)
    .populate('exam', 'examName duration')
    .populate('answers.questionId', 'question options');

  res.status(201).json({
    success: true,
    result: {
      ...populatedResult.toObject(),
      correctAnswers: resultDetails.filter(a => a.isCorrect).length,
      wrongAnswers: examQuestions.length - resultDetails.filter(a => a.isCorrect).length,
      percentage: parseFloat(percentage.toFixed(2)),
      score: totalScore,
      maxScore: maxPossibleScore,
      status
    }
  });
});
