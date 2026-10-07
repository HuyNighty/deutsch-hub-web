import { useRef } from "react";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { getSessionGeneration, isCurrentSession } from "@/shared/auth/auth-session";
import { updateProfile } from "../services/account.service";

const mutationKey = ["account", "update-profile"];

export default function useUpdateProfile() {
  const client = useQueryClient();
  const pending = useRef(false);
  const isPending = useIsMutating({ mutationKey, exact: true }) > 0;
  const mutation = useMutation({
    mutationKey,
    retry: false,
    mutationFn: async ({ payload, generation }) => {
      // A pending Account read must not overwrite the canonical PATCH response.
      await client.cancelQueries({ queryKey: ["account"], exact: true });
      if (!isCurrentSession(generation)) throw new ApiError({ message: "Session changed." });
      return updateProfile(payload);
    },
    onSuccess: async (account, { generation }) => {
      if (!isCurrentSession(generation)) return;
      // Also fence a background read that started while the PATCH was pending.
      await client.cancelQueries({ queryKey: ["account"], exact: true });
      if (isCurrentSession(generation)) client.setQueryData(["account"], account);
    },
    onSettled: () => { pending.current = false; },
  });

  function save(payload, onSuccess) {
    if (pending.current || client.isMutating({ mutationKey, exact: true }) > 0) return;
    pending.current = true;
    const generation = getSessionGeneration();
    mutation.mutate({ payload, generation }, {
      onSuccess: () => { if (isCurrentSession(generation)) onSuccess?.(); },
    });
  }

  return { save, isPending, error: mutation.error, reset: mutation.reset };
}
