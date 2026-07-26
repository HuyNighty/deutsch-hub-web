import { useNavigate } from "react-router-dom";

import { logout } from "../services/auth.service";

import { getRefreshToken, clearTokens } from "@/shared/auth/token";
import { useMutation } from "@tanstack/react-query";

export default function useLogout() {
  const navigate = useNavigate();

  function logoutLocally() {
    clearTokens();

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
