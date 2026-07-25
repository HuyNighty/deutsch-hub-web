import { useAuth } from "@/features/auth/hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  const location = useLocation();

  if (!isAuthenticated) {
    <Navigate to="/login" replace state={{ form: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
