// Server restart trigger
import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import examRoutes from "./routes/examRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import submitExamRoutes from "./routes/submitExamRoutes.js";
import compileRoutes from "./routes/compileRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Check DB connection status
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "Database not connected" });
  }
  next();
});

// Session configuration (replaces JWT cookie auth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      // maxAge removed to make it a session cookie (expires when browser closes)
    },
  })
);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/submission", submitExamRoutes);
app.use("/api/compile", compileRoutes);
app.use("/api/tasks", taskRoutes);

// we we are deploying this in production
// make frontend build then
if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  // we making front build folder static to serve from this app
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  // if we get an routes that are not define by us we show then index html file
  // every enpoint that is not api/users go to this index file
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("<h1>server is running </h1>");
  });
}

// Custom Middlewares
app.use(notFound);
app.use(errorHandler);

// Server
app.listen(port, async () => {
  console.log(`server is running on http://localhost:${port}`);

  // Seed default admin if not exists
  try {
    const User = (await import("./models/userModel.js")).default;
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('Seeding default admin user...');
      await User.create({
        name: 'System Admin',
        email: 'admin@collage.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Default admin created successfully.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
});

// Todos:
// -**POST /api/users**- Register a users
// -**POST /api/users/auth**- Authenticate a user and get token
// -**POST /api/users/logout**- logou user and clear cookie
// -**GET /api/users/profile**- Get user Profile
// -**PUT /api/users/profile**- Update user Profile
