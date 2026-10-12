import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ requireBusiness = true }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { activeBusinessId } = useSelector((state) => state.business);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireBusiness && !activeBusinessId) return <Navigate to="/businesses" replace />;

  return <Outlet />;
}
