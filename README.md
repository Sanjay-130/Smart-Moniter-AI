# Smart-MoniterAI: Automated Exam Proctoring System

Smart-MoniterAI is a comprehensive, Automated Exam Proctoring System (AEPS) built with the MERN stack and client-side AI. It leverages **TensorFlow.js** for real-time, privacy-preserving monitoring and features a professional-grade **Integrated Code Editor (IDE)** for programming assessments.

---

## 🚀 Key Features

### 💻 Professional Integrated Code Editor (IDE)
Specifically designed for coding exams, the system includes a high-performance editor powered by the **Monaco Editor** (the same engine as VS Code).
- **Multi-Language Support**: Complete environments for **Python**, **JavaScript**, and **Java**.
- **IntelliSense & Autocomplete**: Real-time code suggestions, parameter hints, and auto-closing brackets.
- **Themes**: Switch between **Dark**, **Light**, and **High Contrast** modes for personalized comfort.
- **Test Case Execution**: Execute code against pre-defined test cases with instant feedback.
- **Hidden Test Cases**: Support for private test cases to ensure robust code evaluation and prevent hardcoding.

### 👁️ Advanced AI Proctoring (Edge-AI)
The platform runs vision-based AI models directly in the student's browser using **TensorFlow.js**, ensuring zero-delay detection and high user privacy.
- **Face Detection**: Monitors for "No Face Detected" or "Multiple Faces Detected" incidents.
- **Object Detection**: Identifies prohibited items like **Mobile Phones** or books within the camera frame.
- **Posture Analysis**: Detects suspicious behaviors, such as leaning too far back or looking away from the screen.
- **Real-time Alerts**: Immediate visual feedback warn students of potential malpractice, helping them correct their behavior.

### 🛡️ Malpractice Enforcement & Security
- **Automatic Account Blocking**: The system automatically blocks student accounts after **3 recorded proctoring incidents**.
- **Teacher Review & Override**: Teachers have full visibility into cheating logs and can manually unblock students by deleting valid/resolved logs.
- **Exam Access Codes**: Optional password protection for examinations to ensure only authorized candidates can enter.
- **Enforced Fullscreen**: Minimizes distractions and prevents tab switching during active exam sessions.

### 📊 Performance Analytics
- **Student Dashboard**: Visualizes performance trends using SVG charts and provides real-time alerts on malpractice counts.
- **Teacher Dashboard**: Comprehensive overview of student performance, assignment status, and proctoring incidents.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Redux Toolkit, Material-UI (MUI), Monaco Editor.
- **AI/ML**: TensorFlow.js (COCO-SSD & MediaPipe).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Auth**: JWT with HttpOnly cookies for maximum security.

---

## 📂 Repository Layout

- `backend/` — Express server, routes, controllers, models, and custom middleware.
- `frontend/` — React application, UI components, and TensorFlow.js integration.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🚀 Getting Started

### 1. Installation
Install dependencies for both the root, frontend, and backend:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Run in Development
Start both the client and server concurrently from the repo root:
```bash
npm run dev
```

### 3. Production Build
Build the frontend and serve it via the backend:
```bash
cd frontend && npm run build
# Ensure NODE_ENV is set to production
```

---

## 📡 API Snapshot

- **Auth**: `Register`, `Login`, `Logout`, `Profile Update`.
- **Exams**: `List Exams`, `Create/Delete Exam`, `Set Access Code`, `Validate Code`.
- **Proctoring**: `Save Cheating Log`, `Fetch Logs by Exam`, `Delete Log`.
- **Assignments**: `Assign Exam to Student`, `Fetch Student Tasks`.

---

## 🗺️ Roadmap & Future Enhancements
- [ ] Add PDF report generation for exam results.
- [ ] Implement voice/audio proctoring signals.
- [ ] Dockerization for easy deployment pipelines.
- [ ] Enhanced analytics using ApexCharts.
