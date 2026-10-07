import { nextActivityKey } from "@/features/my-learning/guidance/hooks/useNextActivity";
import { useRef } from "react";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { startTask } from "../task.service";
import { taskRoute, taskStartKey } from "../task-query";
import { finalSubmitKey } from "../../attempt/final-submit-query";

export function useStartTask(assessmentAttemptId, taskId) {
  const pending = useRef(false);
  const client = useQueryClient();
  const navigate = useNavigate();
  const finalKey = finalSubmitKey(assessmentAttemptId);
  const finalizing = useIsMutating({ mutationKey: finalKey, exact: true }) > 0;
  const mutation = useMutation({
    mutationKey: taskStartKey(assessmentAttemptId, taskId),
    mutationFn: (target) => startTask(target.assessmentAttemptId, target.taskId),
    retry: false,
    onSuccess: (result) => {
      void client.invalidateQueries({ queryKey: nextActivityKey, exact: true, refetchType: "none" });
      void client.invalidateQueries({
        queryKey: ["learner-assessment-attempt", result.assessmentAttemptId],
        exact: true, refetchType: "none",
      });
      navigate(taskRoute(result.assessmentAttemptId, result.taskId));
    },
    onSettled: () => { pending.current = false; },
  });
  function start() {
    if (pending.current || client.isMutating({ mutationKey: finalKey, exact: true }) > 0) return;
    pending.current = true;
    mutation.mutate({ assessmentAttemptId, taskId });
  }
  return { start, isPending: mutation.isPending, isFinalSubmitting: finalizing, error: mutation.error };
}
