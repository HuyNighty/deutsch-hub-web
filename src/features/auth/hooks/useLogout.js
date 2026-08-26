import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth.service";

import { getRefreshToken } from "@/shared/auth/token";
import { useAuth } from "@/features/auth/context/AuthProvider";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout: clearAuthSession } = useAuth();

  function logoutLocally() {
    queryClient.clear();

    clearAuthSession();

    navigate("/login", {
      replace: true,
    });
  }

  const { mutate, isPending } = useMutation({
    mutationFn: logout,

    onError(error) {
      console.log(error);
    },

    onSettled() {
      logoutLocally();
    },
  });

  function handleLogout() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      logoutLocally();
      return;
    }

    mutate(refreshToken);
  }

  return {
    handleLogout,
    loading: isPending,
  };
}
