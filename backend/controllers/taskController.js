import asyncHandler from "express-async-handler";
import Task from "../models/taskModel.js";
import User from "../models/userModel.js";

// @desc    Create a new task (Admin)
// @route   POST /api/tasks
// @access  Public (Admin)
const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo } = req.body;

    if (!assignedTo) {
        res.status(400);
        throw new Error("Please select a teacher to assign the task to");
    }

    const task = await Task.create({
        title,
        description,
        assignedTo,
        // assignedBy left undefined for Admin
    });

    res.status(201).json(task);
});

// @desc    Get all tasks (Admin)
// @route   GET /api/tasks/admin/all
// @access  Public (Admin)
const getAllTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.find({}).populate("assignedTo", "name email").sort({ createdAt: -1 });
    res.json(tasks);
});

// @desc    Get logged-in teacher's tasks
// @route   GET /api/tasks/my
// @access  Private (Teacher)
const getMyTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.find({ assignedTo: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
});

// @desc    Mark task as completed
// @route   PUT /api/tasks/:id/complete
// @access  Private (Teacher)
const completeTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (task) {
        // Verify ownership
        if (task.assignedTo.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error("Not authorized to update this task");
        }

        task.status = "completed";
        const updatedTask = await task.save();
        res.json(updatedTask);
    } else {
        res.status(404);
        throw new Error("Task not found");
    }
});

// @desc    Mark task as read
// @route   PUT /api/tasks/:id/read
// @access  Private (Teacher)
const markTaskRead = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (task) {
        // Verify ownership
        if (task.assignedTo.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error("Not authorized to update this task");
        }

        task.isRead = true;
        const updatedTask = await task.save();
        res.json(updatedTask);
    } else {
        res.status(404);
        throw new Error("Task not found");
    }
});

// @desc    Mark ALL tasks as read for user
// @route   PUT /api/tasks/read-all
// @access  Private
const markAllRead = asyncHandler(async (req, res) => {
    await Task.updateMany(
        { assignedTo: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );
    res.json({ message: "All tasks marked as read" });
});


// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Public (Admin)
const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (task) {
        await task.deleteOne();
        res.json({ message: "Task removed" });
    } else {
        res.status(404);
        throw new Error("Task not found");
    }
});

export { createTask, getAllTasks, getMyTasks, completeTask, markTaskRead, markAllRead, deleteTask };
