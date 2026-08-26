import { useAuth } from "@/features/auth/context/AuthProvider";
import { Navigate, Outlet } from "react-router-dom";

function GuestRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
