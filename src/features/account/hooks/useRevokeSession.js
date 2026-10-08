import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { getSessionGeneration, isCurrentSession, terminateAuthSession } from "@/shared/auth/auth-session";
import { revokeSession } from "../services/account.service";
import { sessionsQueryKey } from "./useSessions";
import { globalLogoutMutationKey } from "./useGlobalLogout";

const mutationKey = ["account", "sessions", "revoke"];

export default function useRevokeSession() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const pending = useRef(false);
  const [success, setSuccess] = useState(null);
  const isPending = useIsMutating({ mutationKey, exact: true }) > 0;
  const mutation = useMutation({
    mutationKey,
    retry: false,
    mutationFn: ({ session, generation }) => {
      if (!isCurrentSession(generation)) throw new ApiError({ message: "Session changed." });
      return revokeSession(session.id);
    },
    onSuccess: async (_, { session, generation }) => {
      if (!isCurrentSession(generation)) return;
      if (session.current) {
        terminateAuthSession(generation);
        // Commit Login before ProtectedRoute can replace the explanation state.
        navigate("/login", { replace: true, flushSync: true, state: { sessionEnded: true, returnTo: "/account" } });
        return;
      }
      // A pre-revoke GET must not restore the selected session's old status.
      await client.cancelQueries({ queryKey: sessionsQueryKey, exact: true });
      if (!isCurrentSession(generation)) return;
      await client.invalidateQueries({ queryKey: sessionsQueryKey, exact: true });
      if (isCurrentSession(generation)) setSuccess("Login session revoked.");
    },
    onSettled: () => { pending.current = false; },
  });

  function revoke(session, onSuccess) {
    if (pending.current || client.isMutating({ mutationKey, exact: true }) > 0 ||
        client.isMutating({ mutationKey: globalLogoutMutationKey, exact: true }) > 0) return;
    pending.current = true;
    setSuccess(null);
    const generation = getSessionGeneration();
    mutation.mutate({ session, generation }, {
      onSuccess: () => { if (isCurrentSession(generation)) onSuccess?.(); },
    });
  }

  function reset() {
    mutation.reset();
    setSuccess(null);
  }
  return { revoke, isPending, error: mutation.error, success, reset };
}
