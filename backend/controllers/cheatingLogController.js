import asyncHandler from "express-async-handler";
import mongoose from 'mongoose';
import CheatingLog from "../models/cheatingLogModel.js";
import User from "../models/userModel.js";

// @desc Save cheating log data
// @route POST /api/cheatingLogs
// @access Private
const saveCheatingLog = asyncHandler(async (req, res) => {
  const {
    noFaceCount,
    multipleFaceCount,
    cellPhoneCount,
    prohibitedObjectCount,
    leaningBackCount,
    examId,
    username,
    email,
  } = req.body;

  // Attempt to enrich with rollNumber if we can resolve the user
  let rollNumber = undefined;
  try {
    if (req.user && req.user.role === 'student') {
      const u = await User.findById(req.user._id);
      rollNumber = u?.rollNumber;
    } else if (email) {
      const u = await User.findOne({ email });
      rollNumber = u?.rollNumber;
    }
  } catch (e) {
    // ignore enrichment failures
  }

  const cheatingLog = new CheatingLog({
    noFaceCount,
    multipleFaceCount,
    cellPhoneCount,
    prohibitedObjectCount,
    leaningBackCount,
    examId,
    username,
    email,
    rollNumber,
  });

  const savedLog = await cheatingLog.save();

  // Try to locate the student and update malpractice counters.
  // Prefer authenticated user (student) if available; else try by email.
  try {
    let targetUser = null;
    if (req.user && req.user.role === 'student') {
      targetUser = await User.findById(req.user._id);
    } else if (email) {
      targetUser = await User.findOne({ email });
    }

    if (targetUser && targetUser.role === 'student') {
      targetUser.malpracticeCount = (targetUser.malpracticeCount || 0) + 1;
      // Block if more than 2 malpractice incidents recorded
      if (targetUser.malpracticeCount > 2) {
        targetUser.isBlocked = true;
      }
      await targetUser.save();
    }
  } catch (e) {
    // do not fail the request if user update fails; log in server logs
    console.error('Failed to update malpractice counters', e);
  }

  if (savedLog) {
    res.status(201).json(savedLog);
  } else {
    res.status(400);
    throw new Error("Invalid Cheating Log Data");
  }
});

// @desc Get all cheating log data for a specific exam
// @route GET /api/cheatingLogs/:examId
// @access Private
const getCheatingLogsByExamId = asyncHandler(async (req, res) => {
  const examId = req.params.examId;
  const cheatingLogs = await CheatingLog.find({ examId });

  // If any entries are missing rollNumber, enrich from User collection by email
  const emailsNeedingLookup = Array.from(
    new Set(
      cheatingLogs
        .filter((log) => !log.rollNumber && log.email)
        .map((log) => log.email)
    )
  );

  let emailToRoll = {};
  if (emailsNeedingLookup.length > 0) {
    const users = await User.find({ email: { $in: emailsNeedingLookup } }).select('email rollNumber');
    users.forEach((u) => {
      emailToRoll[u.email] = u.rollNumber || undefined;
    });
  }

  const enriched = cheatingLogs.map((log) => {
    if (!log.rollNumber && log.email && emailToRoll[log.email]) {
      return { ...log.toObject(), rollNumber: emailToRoll[log.email] };
    }
    return log;
  });

  res.status(200).json(enriched);
});

// @desc Delete a cheating log entry by ID
// @route DELETE /api/cheatingLogs/:id
// @access Private/Teacher
const deleteCheatingLog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate id to avoid Mongoose CastError
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid cheating log id');
  }

  // Fetch the log first so we know which student's counters to adjust
  const log = await CheatingLog.findById(id);

  if (!log) {
    res.status(404);
    throw new Error('Cheating log not found');
  }

  // Delete the log entry
  await CheatingLog.findByIdAndDelete(id);

  // Attempt to decrement the student's malpractice counters based on the log's email
  try {
    if (log.email) {
      const user = await User.findOne({ email: log.email });
      if (user && user.role === 'student') {
        const current = Number(user.malpracticeCount || 0);
        const next = Math.max(0, current - 1);
        user.malpracticeCount = next;
        // If count drops below the blocking threshold (<= 2), ensure the student is unblocked
        if (next <= 2 && user.isBlocked) {
          user.isBlocked = false;
        }
        await user.save();
      }
    }
  } catch (e) {
    // Log the error but do not fail the deletion response
    console.error('Failed to adjust malpractice counters on delete', e);
  }

  res.status(200).json({ message: 'Cheating log deleted', id });
});

// @desc Get current student's own cheating logs
// @route GET /api/exams/my-cheatingLogs
// @access Private/Student
const getMyCheatingLogs = asyncHandler(async (req, res) => {
  const email = req.user.email;
  const cheatingLogs = await CheatingLog.find({ email }).sort({ createdAt: -1 });
  res.status(200).json(cheatingLogs);
});

// @desc Get all cheating logs (Admin/Teacher)
// @route GET /api/exams/cheatingLogs/all
// @access Private
const getAllCheatingLogs = asyncHandler(async (req, res) => {
  const logs = await CheatingLog.find({}).sort({ createdAt: -1 }).limit(100);
  res.status(200).json(logs);
});

export { saveCheatingLog, getCheatingLogsByExamId, deleteCheatingLog, getMyCheatingLogs, getAllCheatingLogs };
