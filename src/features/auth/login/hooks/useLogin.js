import { useLocation, useNavigate } from "react-router-dom";
import { saveAccessToken, saveRefreshToken } from "@/shared/auth/token";
import { login } from "../services/login.service";
import { useMutation } from "@tanstack/react-query";

function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess(session) {
      saveAccessToken(session.accessToken);
      saveRefreshToken(session.refreshToken);

      const redirectTo = location.state?.redirectTo || "/account";

      navigate(redirectTo, { replace: true });
    },
    onError(error) {
      console.log(error);
    },
  });

  function handleLogin(request) {
    mutate(request);
  }

  return {
    handleLogin,
    loading: isPending,
  };
}

export default useLogin;
