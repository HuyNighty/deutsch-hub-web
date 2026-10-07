import { useRef } from "react";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTaskRuntime, submitTask } from "../task.service";
import { TaskSubmitResponseError } from "../task-response";
import { taskQuizKey, taskAnswerKey, taskSubmitKey } from "../task-query";

export function useSubmitTask(runtime) {
  const client = useQueryClient();
  const pending = useRef(false);
  const submitKey = taskSubmitKey(runtime.assessmentAttemptId, runtime.taskId);
  const answerKey = taskAnswerKey(runtime.assessmentAttemptId, runtime.taskId);
  const submitting = useIsMutating({ mutationKey: submitKey, exact: true }) > 0;
  const answering = useIsMutating({ mutationKey: answerKey }) > 0;

  function invalidateParent(assessmentAttemptId) {
    void client.invalidateQueries({
      queryKey: ["learner-assessment-attempt", assessmentAttemptId],
      exact: true, refetchType: "none",
    });
  }

  const mutation = useMutation({
    mutationKey: submitKey,
    retry: false,
    mutationFn: async (target) => {
      const queryKey = taskQuizKey(target.assessmentAttemptId, target.taskId);
      await client.cancelQueries({ queryKey, exact: true });
      try {
        return await submitTask(target);
      } catch (error) {
        // Shared envelope errors also have neither an HTTP status nor a transport code.
        const contractError = error instanceof TaskSubmitResponseError ||
          (error.status == null && error.code == null);
        if (contractError) throw error;
        await client.cancelQueries({ queryKey, exact: true });
        const previous = client.getQueryState(queryKey);
        try {
          const fresh = await client.fetchQuery({
            queryKey,
            queryFn: () => getTaskRuntime(target.assessmentAttemptId, target.taskId),
            staleTime: 0, retry: false,
          });
          if (fresh.status === "SUBMITTED") invalidateParent(target.assessmentAttemptId);
        } catch {
          // Keep the last canonical evidence visible and the original Submit error authoritative.
          if (previous?.data) {
            client.setQueryData(queryKey, previous.data, { updatedAt: previous.dataUpdatedAt });
          }
        }
        throw error;
      }
    },
    onSuccess: (result) => {
      client.setQueryData(taskQuizKey(result.assessmentAttemptId, result.taskId), (current) => {
        if (!current || current.quizAttemptId !== result.quizAttemptId) return current;
        return { ...current, status: result.status, submittedAt: result.submittedAt };
      });
      invalidateParent(result.assessmentAttemptId);
    },
    onSettled: () => { pending.current = false; },
  });

  function submit() {
    const current = client.getQueryData(taskQuizKey(runtime.assessmentAttemptId, runtime.taskId));
    if (pending.current || current?.status !== "IN_PROGRESS" ||
        client.isMutating({ mutationKey: answerKey }) > 0 ||
        client.isMutating({ mutationKey: submitKey, exact: true }) > 0) return;
    pending.current = true;
    mutation.mutate(runtime);
  }

  return { submit, isPending: submitting, answering, error: mutation.error };
}
