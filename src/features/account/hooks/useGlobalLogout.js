import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { getSessionGeneration, isCurrentSession, terminateAuthSession } from "@/shared/auth/auth-session";
import { logoutAllSessions } from "../services/account.service";

export const globalLogoutMutationKey = ["account", "logout-all"];
const competingMutation = ({ options: { mutationKey: key } }) =>
  Array.isArray(key) && key[0] === "account" && (
    (key.length === 2 && key[1] === "change-password") ||
    (key.length === 3 && key[1] === "sessions" && key[2] === "revoke")
  );

export default function useGlobalLogout() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const pending = useRef(false);
  const isPending = useIsMutating({ mutationKey: globalLogoutMutationKey, exact: true }) > 0;
  const competingPending = useIsMutating({ predicate: competingMutation }) > 0;
  const mutation = useMutation({
    mutationKey: globalLogoutMutationKey,
    retry: false,
    mutationFn: ({ generation }) => {
      if (!isCurrentSession(generation)) throw new ApiError({ message: "Session changed." });
      return logoutAllSessions();
    },
    onSuccess: (_, { generation }) => {
      if (!isCurrentSession(generation)) return;
      terminateAuthSession(generation);
      // Commit Login before ProtectedRoute can replace the success state.
      navigate("/login", { replace: true, flushSync: true, state: { allSessionsRevoked: true, returnTo: "/account" } });
    },
    onSettled: () => { pending.current = false; },
  });

  function confirm() {
    if (pending.current || client.isMutating({ mutationKey: globalLogoutMutationKey, exact: true }) > 0 ||
        client.isMutating({ predicate: competingMutation }) > 0) return;
    pending.current = true;
    mutation.mutate({ generation: getSessionGeneration() });
  }
  return { confirm, isPending, competingPending, error: mutation.error, reset: mutation.reset };
}
