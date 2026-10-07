import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/login.service";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthProvider";
import { getSessionGeneration } from "@/shared/auth/auth-session";
import { safeReturnTo } from "@/shared/routing/return-to";

function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const pending = useRef(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ request, generation }) => ({
      session: await login(request),
      generation,
    }),
    onSuccess({ session, generation }) {
      setSession(session, generation);
      navigate(safeReturnTo(location.state?.returnTo), { replace: true });
    },
  });

  function handleLogin(request) {
    // Also fence repeat submissions before React renders isPending.
    if (pending.current) return pending.current;
    pending.current = mutateAsync({ request, generation: getSessionGeneration() })
      .finally(() => { pending.current = null; });
    return pending.current;
  }

  return { handleLogin, loading: isPending };
}

export default useLogin;
