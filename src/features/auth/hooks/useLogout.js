import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth.service";
import { getRefreshToken } from "@/shared/auth/token";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { useMutation } from "@tanstack/react-query";

export default function useLogout() {
  const navigate = useNavigate();
  const { logout: clearAuthSession } = useAuth();
  const { mutate, isPending } = useMutation({
    mutationFn: logout,
    onError(error) {
      console.log(error);
    },
  });

  function handleLogout() {
    const refreshToken = getRefreshToken();
    // Fence immediately. Server completion never changes local session state.
    clearAuthSession();
    navigate("/login", { replace: true });
    if (refreshToken) mutate(refreshToken);
  }

  return { handleLogout, loading: isPending };
}
