import React, { lazy } from 'react';
import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const ExamLayout = Loadable(lazy(() => import('../layouts/full/ExamLayout')));

/* ****Pages***** */
// const Dashboard = Loadable(lazy(() => import('../views/dashboard/Dashboard')));
// const CommonPages = Loadable(lazy(() => import('../views/Success')));

const Success = Loadable(lazy(() => import('../views/Success')));

//Student Routes

const TestPage = Loadable(lazy(() => import('./../views/student/TestPage')));
const ExamPage = Loadable(lazy(() => import('./../views/student/ExamPage')));
const DashboardRouter = Loadable(lazy(() => import('../views/DashboardRouter')));
const ExamDetails = Loadable(lazy(() => import('./../views/student/ExamDetails')));
const CategoryTests = Loadable(lazy(() => import('./../views/student/CategoryTests')));
const MyTasksPage = Loadable(lazy(() => import('./../views/student/MyTasksPage')));
const StudentProfile = Loadable(lazy(() => import('./../views/student/ProfilePage')));
const MyResultsPage = Loadable(lazy(() => import('./../views/student/MyResultsPage')));
const TodayPage = Loadable(lazy(() => import('./../views/student/TodayPage')));
const SystemCheck = Loadable(lazy(() => import('./../views/student/SystemCheck')));
const ProfilePage = Loadable(lazy(() => import('./../views/ProfilePage')));
//Auth Routes
const Error = Loadable(lazy(() => import('../views/authentication/Error')));
const Register = Loadable(lazy(() => import('../views/authentication/Register')));
const Login = Loadable(lazy(() => import('../views/authentication/Login')));
const LoginStudent = Loadable(lazy(() => import('../views/authentication/LoginStudent')));
const LoginTeacher = Loadable(lazy(() => import('../views/authentication/LoginTeacher')));
const ForgotPassword = Loadable(lazy(() => import('../views/authentication/ForgotPassword')));
const UserAccount = Loadable(lazy(() => import('../views/authentication/UserAccount')));

// Teacher Routes
const CreateExamPage = Loadable(lazy(() => import('./../views/teacher/CreateExamPage')));
const ExamLogPage = Loadable(lazy(() => import('./../views/teacher/ExamLogPage')));
const AddQuestions = Loadable(lazy(() => import('./../views/teacher/AddQuestions')));
const ManageExamsPage = Loadable(lazy(() => import('./../views/teacher/ManageExamsPage')));
const AssignExamPage = Loadable(lazy(() => import('./../views/teacher/AssignExamPage')));
const TeacherProfile = Loadable(lazy(() => import('./../views/teacher/ProfilePage')));
const PrivateRoute = Loadable(lazy(() => import('src/views/authentication/PrivateRoute')));
const TeacherRoute = Loadable(lazy(() => import('src/views/authentication/TeacherRoute')));
const BlockStudentPage = Loadable(lazy(() => import('./../views/teacher/BlockStudentPage')));
const AdminPage = Loadable(lazy(() => import('./../views/admin/AdminPage')));
const AdminRoute = Loadable(lazy(() => import('../views/authentication/AdminRoute')));
const AdminLogin = Loadable(lazy(() => import('../views/authentication/AdminLogin')));

const Router = createBrowserRouter(
  createRoutesFromElements(
    // Every router we create will now go in here as
    // they going to be child of our main App component
    <>
      {/* // Private Routes */}
      <Route path="" element={<PrivateRoute />}>
        {/* // Main layout */}
        <Route path="/" element={<FullLayout />}>
          <Route index={true} path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" exact={true} element={<DashboardRouter />} />
          <Route path="/Success" exact={true} element={<Success />} />
          <Route path="/exam" exact={true} element={<ExamPage />} />
          <Route path="/exam/category/:categoryId" exact={true} element={<CategoryTests />} />
          <Route path="/my-tasks" exact={true} element={<MyTasksPage />} />
          <Route path="/today" exact={true} element={<TodayPage />} />
          <Route path="/my-results" exact={true} element={<MyResultsPage />} />
          <Route path="/system-check" exact={true} element={<SystemCheck />} />
          <Route path="/profile" exact={true} element={<StudentProfile />} />
          <Route path="" element={<TeacherRoute />}>
            <Route path="/create-exam" exact={true} element={<CreateExamPage />} />
            <Route path="/add-questions" exact={true} element={<AddQuestions />} />
            <Route path="/manage-exams" exact={true} element={<ManageExamsPage />} />
            <Route path="/assign-exam" exact={true} element={<AssignExamPage />} />
            <Route path="/exam-log" exact={true} element={<ExamLogPage />} />
            <Route path="/teacher-profile" exact={true} element={<TeacherProfile />} />
            <Route path="/teacher-profile" exact={true} element={<TeacherProfile />} />
            <Route path="/block-student" exact={true} element={<BlockStudentPage />} />
          </Route>
        </Route>
        <Route path="/" element={<ExamLayout />}>
          <Route path="exam/:examId" exact={true} element={<ExamDetails />} />
          <Route path="exam/:examId/:testId" exact={true} element={<TestPage />} />
        </Route>
        {/* User layout */}
        <Route path="/user" element={<FullLayout />}>
          <Route path="account" exact={true} element={<UserAccount />} />
          <Route path="profile" exact={true} element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin page - protected by AdminRoute */}
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<BlankLayout />}>
          <Route index element={<AdminPage />} />
        </Route>
      </Route>

      {/* Authentication layout */}
      <Route path="/auth" element={<BlankLayout />}>
        <Route path="404" element={<Error />} />

        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/login-student" element={<LoginStudent />} />
        <Route path="/auth/login-teacher" element={<LoginTeacher />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/admin-login" element={<AdminLogin />} />
        {/* <Route path="*" element={<Navigate to="/auth/404" />} /> */}
      </Route>
    </>,
  ),
);

export default Router;
