import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCookie } from '../lib/cookies';

export default function RequireAuth() {
  const token = getCookie('token');
  const location = useLocation();
  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
