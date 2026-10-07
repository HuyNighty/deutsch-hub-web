import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { startTask } from "../task.service";
import { taskRoute } from "../task-query";

export function useStartTask(assessmentAttemptId, taskId) {
  const pending = useRef(false);
  const client = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (target) => startTask(target.assessmentAttemptId, target.taskId),
    retry: false,
    onSuccess: (result) => {
      void client.invalidateQueries({
        queryKey: ["learner-assessment-attempt", result.assessmentAttemptId],
        exact: true, refetchType: "none",
      });
      navigate(taskRoute(result.assessmentAttemptId, result.taskId));
    },
    onSettled: () => { pending.current = false; },
  });
  function start() {
    if (pending.current) return;
    pending.current = true;
    mutation.mutate({ assessmentAttemptId, taskId });
  }
  return { start, isPending: mutation.isPending, error: mutation.error };
}
