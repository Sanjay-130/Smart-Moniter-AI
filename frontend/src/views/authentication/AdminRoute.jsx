import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const isAdminFlag = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';
  const isActuallyAdmin = isAdminFlag || userInfo?.role === 'admin';

  return isActuallyAdmin ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default AdminRoute;
