import { useAuth } from "@/features/auth/context/AuthProvider";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute() {
  const { isAuthenticated, isChecking } = useAuth();

  const location = useLocation();

  if (isChecking) return null;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: location.pathname + location.search + location.hash }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
