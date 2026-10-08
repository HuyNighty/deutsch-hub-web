import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { getSessionGeneration, isCurrentSession, terminateAuthSession } from "@/shared/auth/auth-session";
import { changePassword } from "../services/account.service";

const mutationKey = ["account", "change-password"];

export default function useChangePassword() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const pending = useRef(false);
  const isPending = useIsMutating({ mutationKey, exact: true }) > 0;
  const mutation = useMutation({
    mutationKey,
    retry: false,
    mutationFn: ({ request, generation }) => {
      if (!isCurrentSession(generation)) throw new ApiError({ message: "Session changed." });
      return changePassword(request);
    },
    onSuccess: (_, { generation }) => {
      if (!isCurrentSession(generation)) return;
      terminateAuthSession(generation);
      // Commit Login before ProtectedRoute can replace the success state.
      navigate("/login", { replace: true, flushSync: true, state: { passwordChanged: true, returnTo: "/account" } });
    },
    onSettled: () => { pending.current = false; },
  });

  function submit(request) {
    if (pending.current || client.isMutating({ mutationKey, exact: true }) > 0) return;
    pending.current = true;
    mutation.mutate({ request, generation: getSessionGeneration() });
  }

  return { submit, isPending, error: mutation.error, reset: mutation.reset };
}
