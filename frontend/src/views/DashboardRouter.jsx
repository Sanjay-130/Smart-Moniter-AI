import React from 'react';
import { useSelector } from 'react-redux';
import DashboardHome from './student/DashboardHome';
import TeacherDashboard from './teacher/TeacherDashboard';
import { Navigate } from 'react-router-dom';

const DashboardRouter = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
  if (userInfo?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  if (userInfo?.role === 'teacher') {
    return <TeacherDashboard />;
  }
  
  return <DashboardHome />;
};

export default DashboardRouter;
