import { useRef } from "react";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { finalSubmitAssessment, getAssessmentAttempt } from "../attempt.service";
import { FinalSubmitResponseError } from "../final-submit-response";
import { childMutationFilter, finalSubmitKey } from "../final-submit-query";

export function useFinalSubmit(attempt, definition) {
  const client = useQueryClient();
  const pending = useRef(false);
  const finalized = useRef(false);
  const mutationKey = finalSubmitKey(attempt.assessmentAttemptId);
  const childFilter = childMutationFilter(attempt.assessmentAttemptId);
  const submitting = useIsMutating({ mutationKey, exact: true }) > 0;
  const childrenPending = useIsMutating(childFilter) > 0;

  function invalidateExecution(assessmentAttemptId) {
    void client.invalidateQueries({ queryKey: ["learner-learning-journey"], exact: true, refetchType: "none" });
    void client.invalidateQueries({
      queryKey: ["learner-assessment-task-quiz", assessmentAttemptId], refetchType: "none",
    });
  }

  async function refreshParent(assessmentAttemptId) {
    const queryKey = ["learner-assessment-attempt", assessmentAttemptId];
    await client.cancelQueries({ queryKey, exact: true });
    const previous = client.getQueryState(queryKey);
    try {
      return await client.fetchQuery({
        queryKey, queryFn: () => getAssessmentAttempt(assessmentAttemptId), staleTime: 0, retry: false,
      });
    } catch {
      // Keep the last canonical snapshot visible; this read cannot replace the POST outcome.
      if (previous?.data) client.setQueryData(queryKey, previous.data, { updatedAt: previous.dataUpdatedAt });
      return null;
    }
  }

  const mutation = useMutation({
    mutationKey, retry: false,
    mutationFn: async ({ target, targetDefinition }) => {
      const id = target.assessmentAttemptId;
      await client.cancelQueries({ queryKey: ["learner-assessment-attempt", id], exact: true });
      let result;
      try {
        result = await finalSubmitAssessment(id, targetDefinition);
      } catch (error) {
        // Shared malformed envelopes have neither an HTTP status nor a transport code.
        if (error instanceof FinalSubmitResponseError || (error.status == null && error.code == null)) throw error;
        const fresh = await refreshParent(id);
        if (["COMPLETED", "EXPIRED"].includes(fresh?.status)) invalidateExecution(id);
        throw error;
      }
      finalized.current = true;
      await refreshParent(id);
      invalidateExecution(id);
      return result;
    },
    onSettled: () => { pending.current = false; },
  });

  function submit() {
    const current = client.getQueryData(["learner-assessment-attempt", attempt.assessmentAttemptId]);
    if (pending.current || finalized.current || !["IN_PROGRESS", "EXPIRED"].includes(current?.status) ||
        client.isMutating(childFilter) > 0 || client.isMutating({ mutationKey, exact: true }) > 0) return;
    pending.current = true;
    mutation.mutate({ target: attempt, targetDefinition: definition });
  }

  const staleError = attempt.status === "COMPLETED" ||
    (attempt.status === "EXPIRED" && mutation.variables?.target.status === "IN_PROGRESS");
  return {
    submit, isPending: submitting, childrenPending, isSuccess: mutation.isSuccess,
    error: staleError ? null : mutation.error,
  };
}
