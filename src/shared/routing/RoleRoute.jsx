import { Navigate, Outlet } from "react-router-dom";
import ForbiddenState from "../ui/state/ForbiddenState";
import { useAuth } from "@/features/auth/context/AuthProvider";

function RoleRoute({ roles }) {
  const { isAuthenticated, hasAnyRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAnyRole(roles)) {
    return <ForbiddenState />;
  }

  return <Outlet />;
}

export default RoleRoute;
