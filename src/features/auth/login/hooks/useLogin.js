import { useLocation, useNavigate } from "react-router-dom";
import { saveAccessToken, saveRefreshToken } from "@/shared/auth/token";
import { login } from "../services/login.service";

function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogin(request) {
    try {
      const session = await login(request);

      saveAccessToken(session.accessToken);
      saveRefreshToken(session.refreshToken);

      const redirectTo = location.state?.redirectTo || "/account";

      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error(error);

      throw error;
    }
  }

  return {
    handleLogin,
  };
}

export default useLogin;
