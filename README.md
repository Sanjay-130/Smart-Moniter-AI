# Smart-MoniterAI: Automated Exam Proctoring System

Smart-MoniterAI is a comprehensive, Automated Exam Proctoring System (AEPS) built with the MERN stack and client-side AI. It leverages **TensorFlow.js** for real-time, privacy-preserving monitoring and features a professional-grade **Integrated Code Editor (IDE)** for programming assessments.

---

## 🚀 Key Features

### 💻 Professional Integrated Code Editor (IDE)
Specifically designed for coding exams, the system includes a high-performance editor powered by the **Monaco Editor** (the same engine as VS Code).
- **Multi-Language Support**: Complete environments for **Python**, **JavaScript**, **Java**, **C++**, and **C**.
- **IntelliSense & Autocomplete**: Real-time code suggestions, parameter hints, and auto-closing brackets.
- **Themes**: Switch between **Dark**, **Light**, and **High Contrast** modes for personalized comfort.
- **Test Case Execution**: Execute code against pre-defined test cases with instant feedback.
- **Hidden Test Cases**: Support for private test cases to ensure robust code evaluation and prevent hardcoding.
- **Wandbox Integration**: Free code compilation via Wandbox API (no API key required).

### 👁️ Advanced AI Proctoring (Edge-AI)
The platform runs vision-based AI models directly in the student's browser using **TensorFlow.js**, ensuring zero-delay detection and high user privacy.
- **Face Detection**: Monitors for "No Face Detected" or "Multiple Faces Detected" incidents.
- **Object Detection**: Identifies prohibited items like **Mobile Phones** or books within the camera frame.
- **Posture Analysis**: Detects suspicious behaviors, such as leaning too far back or looking away from the screen.
- **Screenshot Capture**: Automatic screenshot capture during malpractice incidents uploaded to Cloudinary.
- **Real-time Alerts**: Immediate visual feedback warns students of potential malpractice.

### 🛡️ Malpractice Enforcement & Security
- **Automatic Account Blocking**: Student accounts are blocked after **3 recorded proctoring incidents**.
- **Teacher Review & Override**: Teachers can view detailed cheating logs and manually unblock students.
- **Exam Access Codes**: Password protection for examinations to ensure only authorized candidates can enter.
- **Enforced Fullscreen**: Minimizes distractions and prevents tab switching during active exam sessions.
- **Role-Based Access Control**: Separate authentication flows for Students, Teachers, and Admins.

### 👥 User Management
- **Student Management**: Roll number-based identification, profile management with profile picture upload.
- **Teacher Management**: Task assignment system, exam creation and management.
- **Admin Panel**: User administration, bulk registration, system oversight.
- **Password Recovery**: Forgot password and reset password via email (Nodemailer).

### 📊 Performance Analytics
- **Student Dashboard**: Visualizes performance trends, malpractice counts, and upcoming exams.
- **Teacher Dashboard**: Comprehensive overview of student performance and assignment status.
- **Results Tracking**: Detailed exam results with answer review and performance breakdown.
- **Category-Based Exams**: Organize exams by subject categories.

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Session-based auth with express-session (HTTP-only cookies)
- **File Upload**: Multer with Cloudinary integration
- **Email**: Nodemailer for password recovery
- **Code Execution**: Wandbox API integration

### Frontend
- **Framework**: React.js with Redux Toolkit for state management
- **UI Library**: Material-UI (MUI) with custom theming
- **Code Editor**: Monaco Editor (VS Code engine)
- **Charts**: SVG-based custom charts
- **Notifications**: React Toastify

### AI/ML
- **TensorFlow.js**: Client-side machine learning
- **COCO-SSD**: Object detection for prohibited items
- **MediaPipe**: Face detection and posture analysis

### Additional Tools
- **Cloudinary**: Image storage for screenshots and profile pictures
- **UUID**: Unique identifier generation for exams

---

## 📂 Repository Layout

```
Smart-Moniter-AI/
├── backend/
│   ├── config/         # Database configuration
│   ├── controllers/    # Business logic (10 controllers)
│   ├── middleware/     # Auth & error handling middleware
│   ├── models/         # Mongoose schemas (9 models)
│   ├── routes/         # API route definitions (7 routes)
│   ├── utils/          # Utility functions (email, cloudinary, token gen)
│   └── server.js       # Express server entry point
├── frontend/
│   ├── public/         # Static assets
│   └── src/
│       ├── assets/     # Images and static files
│       ├── components/ # Reusable UI components
│       ├── layouts/    # Page layout components
│       ├── routes/     # React Router configuration
│       ├── slices/     # Redux slices (8 slices)
│       ├── theme/      # MUI theme configuration
│       └── views/      # Page components (admin, student, teacher, auth)
├── .env                # Environment variables (not in git)
├── .env.example        # Environment template
├── features.md         # Detailed feature documentation
└── package.json        # Root package.json with dev scripts
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Database
MONGO_URI=your_mongodb_connection_string

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Session Secret
SESSION_SECRET=your_session_secret_key

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 🚀 Getting Started

### 1. Installation
Install dependencies for root, frontend, and backend:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### 2. Environment Setup
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
```

### 3. Run in Development
Start both the client and server concurrently from the repo root:
```bash
npm run dev
```

This runs:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### 4. Production Build
```bash
# Build frontend
cd frontend && npm run build

# Set NODE_ENV to production
# Start backend only (serves static frontend files)
cd ../backend && npm start
```

### Default Admin Account
The system automatically creates a default admin on first run:
- **Email**: `admin@collage.com`
- **Password**: `admin123`

---

## 📡 Complete API Reference

### Authentication (`/api/users`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Public | Register new user (with optional profile pic) |
| POST | `/auth` | Public | Login with roll number or email |
| POST | `/logout` | Public | Logout user and clear session |
| POST | `/forgot-password` | Public | Request password reset email |
| POST | `/reset-password` | Public | Reset password with token |
| GET | `/profile` | Protected | Get user profile |
| PUT | `/profile` | Protected | Update profile (with optional profile pic) |
| GET | `/all` | Admin | Get all users |
| DELETE | `/:id` | Admin | Delete user |
| POST | `/bulk-register` | Admin | Bulk register students |
| POST | `/cheatingLogs` | Protected | Save cheating log |
| POST | `/unblock` | Teacher/Admin | Unblock student account |
| POST | `/block` | Teacher/Admin | Block student account |
| GET | `/student` | Teacher/Admin | Lookup student by email/roll number |
| GET | `/student/history` | Protected | Get student's full history (logs + action logs) |

### Exams (`/api/exams`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Protected | Get all exams |
| POST | `/` | Teacher | Create new exam |
| DELETE | `/:id` | Teacher | Delete exam |
| POST | `/questions` | Teacher | Add question to exam |
| GET | `/questions/:examId` | Protected | Get questions by exam ID |
| POST | `/:examId/validate-access` | Student | Validate exam access code |
| PUT | `/:id/access-code` | Teacher | Set/update exam access code |
| GET | `/categories` | Protected | Get all categories |
| POST | `/categories` | Teacher | Create category |
| DELETE | `/categories/:id` | Teacher | Delete category |
| GET | `/my-cheatingLogs` | Student | Get student's own cheating logs |
| GET | `/cheatingLogs/all` | Protected | Get all cheating logs |
| GET | `/cheatingLogs/:examId` | Teacher | Get cheating logs by exam |
| POST | `/cheatingLogs` | Student | Save cheating log |
| DELETE | `/cheatingLogs/:id` | Teacher | Delete cheating log |

### Assignments (`/api/assignments`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Teacher | Get teacher's assignments |
| POST | `/` | Teacher | Create assignment |
| GET | `/my-tasks` | Student | Get student's assignments |
| PUT | `/:id` | Protected | Update assignment |
| DELETE | `/:id` | Teacher | Delete assignment |

### Results (`/api/results`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Student | Save exam result |
| GET | `/student` | Student | Get student's results |
| GET | `/exam/:examId` | Protected | Get result for specific exam |
| GET | `/teacher/exam/:examId` | Teacher/Admin | Get all results for exam (teacher view) |

### Code Compilation (`/api/compile`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Protected | Compile and execute code |

**Supported Languages**: Python, JavaScript, Java, C++, C

### Exam Submission (`/api/submission`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Student | Submit exam answers |
| POST | `/submit` | Student | Submit exam (alternative endpoint) |

### Tasks (`/api/tasks`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Admin | Create task for teacher |
| GET | `/admin/all` | Admin | Get all tasks |
| DELETE | `/:id` | Admin | Delete task |
| GET | `/my` | Teacher | Get my assigned tasks |
| PUT | `/:id/complete` | Teacher | Mark task as completed |
| PUT | `/:id/read` | Teacher | Mark task as read |
| PUT | `/read-all` | Protected | Mark all tasks as read |

---

## 🔐 Authentication & Roles

The system uses **session-based authentication** with the following roles:

### Roles
- **student**: Can take exams, view results, manage profile
- **teacher**: Can create/manage exams, view student results, manage tasks
- **admin**: Full system access, user management, task assignment

### Middleware Protection
- `protect`: Requires active session
- `studentOnly`: Student role required
- `teacherOnly`: Teacher role required
- `adminOnly`: Admin role required
- `teacherOrAdmin`: Teacher or Admin role required

---

## 🧠 AI Proctoring Detection Types

| Detection Type | Description | Auto-Block Threshold |
|----------------|-------------|----------------------|
| No Face | Student face not detected in camera | Part of 3-strike rule |
| Multiple Faces | More than one person detected | Part of 3-strike rule |
| Cell Phone | Mobile phone detected in frame | Part of 3-strike rule |
| Prohibited Object | Books or other unauthorized items | Part of 3-strike rule |
| Leaning Back | Suspicious posture/position change | Part of 3-strike rule |

**Account Blocking**: After 3 malpractice incidents, the student account is automatically blocked. Teachers/Admins can unblock via the cheating logs interface.

---

## 📊 Database Models

### User
- Fields: name, email, password, rollNumber, dob, role, profilePic, isBlocked, malpracticeCount

### Exam
- Fields: examId, examName, category, liveDate, deadDate, duration, totalQuestions, accessCode

### Question
- Fields: examId, questionText, questionType (MCQ/CODE), options, correctOption, marks, codeQuestion (test cases)

### CheatingLog
- Fields: examId, username, email, rollNumber, noFaceCount, multipleFaceCount, cellPhoneCount, prohibitedObjectCount, leaningBackCount, screenshots

### Result
- Fields: studentId, examId, totalScore, maxPossibleScore, percentage, status (Passed/Failed), answers, timeTaken

### Assignment
- Fields: examId, studentId, teacherId, status, dueDate

### Task
- Fields: title, description, assignedTo, status (pending/completed), isRead

### Category
- Fields: name, description

---

## 🗺️ Roadmap & Future Enhancements

- [ ] PDF report generation for exam results
- [ ] Voice/audio proctoring signals
- [ ] Dockerization for easy deployment
- [ ] Enhanced analytics with ApexCharts
- [ ] Real-time notifications via WebSockets
- [ ] Mobile app companion
- [ ] Plagiarism detection for code submissions

---

## 📝 License

This project is built for educational purposes.

---

## 🤝 Support

For issues or feature requests, please contact the development team.
