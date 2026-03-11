import express from "express";
import {
    createTask,
    getAllTasks,
    getMyTasks,
    completeTask,
    markTaskRead,
    markAllRead,
    deleteTask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin routes (unprotected as per current architecture)
router.post("/", createTask);
router.get("/admin/all", getAllTasks);
router.delete("/:id", deleteTask);

// Teacher routes (protected)
router.get("/my", protect, getMyTasks);
router.put("/read-all", protect, markAllRead);
router.put("/:id/complete", protect, completeTask);
router.put("/:id/read", protect, markTaskRead);

export default router;
