import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/login.service";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthProvider";

function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: login,

    onSuccess(session) {
      setSession(session);

      const from = location.state?.from;

      navigate(
        from ? `${from.pathname}${from.search}${from.hash}` : "/account",
        { replace: true },
      );
    },

    onError(error) {
      console.log(error);
    },
  });

  function handleLogin(request) {
    return mutateAsync(request);
  }

  return {
    handleLogin,
    loading: isPending,
  };
}

export default useLogin;
