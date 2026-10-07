import { useAuth } from "@/features/auth/context/AuthProvider";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { safeReturnTo } from "./return-to";

function GuestRoute() {
  const { isAuthenticated, isChecking } = useAuth();
  const location = useLocation();

  if (isChecking) return null;

  if (isAuthenticated) {
    return <Navigate to={safeReturnTo(location.state?.returnTo)} replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
