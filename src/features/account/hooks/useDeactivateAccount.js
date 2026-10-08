import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { getSessionGeneration, isCurrentSession, terminateAuthSession } from "@/shared/auth/auth-session";
import { deactivateAccount } from "../services/account.service";
import { competesWithDeactivation, deactivationMutationKey } from "./account-mutations";

export default function useDeactivateAccount() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const pending = useRef(null);
  const isPending = useIsMutating({ mutationKey: deactivationMutationKey, exact: true }) > 0;
  const competingPending = useIsMutating({ predicate: competesWithDeactivation }) > 0;
  const mutation = useMutation({
    mutationKey: deactivationMutationKey,
    retry: false,
    mutationFn: ({ generation }) => {
      if (!isCurrentSession(generation)) throw new ApiError({ message: "Session changed." });
      // Keep the password out of the mutation cache and consume it at dispatch.
      const password = pending.current.password;
      pending.current.password = null;
      return deactivateAccount({ password });
    },
    onSuccess: (_, { generation }) => {
      if (!isCurrentSession(generation)) return;
      terminateAuthSession(generation);
      navigate("/login", { replace: true, flushSync: true, state: { accountDeactivated: true } });
    },
    onSettled: () => { pending.current = null; },
  });

  function confirm(password, acknowledged) {
    if (!password.trim() || !acknowledged || pending.current ||
        client.isMutating({ mutationKey: deactivationMutationKey, exact: true }) > 0 ||
        client.isMutating({ predicate: competesWithDeactivation }) > 0) return false;
    const generation = getSessionGeneration();
    pending.current = { password };
    mutation.mutate({ generation });
    return true;
  }

  return { confirm, isPending, competingPending, reset: mutation.reset,
    error: isCurrentSession(mutation.variables?.generation) ? mutation.error : null };
}
