import { useRef } from "react";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { saveTaskAnswer, clearTaskAnswer } from "../task.service";
import { taskQuizKey, taskAnswerKey, taskSubmitKey } from "../task-query";

export function useTaskAnswer(runtime, question) {
  const pending = useRef(false);
  const client = useQueryClient();
  const submitKey = taskSubmitKey(runtime.assessmentAttemptId, runtime.taskId);
  const submitting = useIsMutating({ mutationKey: submitKey, exact: true }) > 0;
  const mutation = useMutation({
    mutationKey: [...taskAnswerKey(runtime.assessmentAttemptId, runtime.taskId), question.questionId],
    retry: false,
    mutationFn: async ({ targetRuntime, targetQuestion, selectedAnswerIds }) => {
      const queryKey = taskQuizKey(targetRuntime.assessmentAttemptId, targetRuntime.taskId);
      // An older runtime read must not replace a subsequently validated saved answer.
      await client.cancelQueries({ queryKey, exact: true });
      if (selectedAnswerIds.length) {
        return saveTaskAnswer(targetRuntime, targetQuestion, selectedAnswerIds);
      }
      const result = await clearTaskAnswer(targetRuntime, targetQuestion);
      return { ...result, selectedAnswerIds: [] };
    },
    onSuccess: (result) => {
      client.setQueryData(taskQuizKey(result.assessmentAttemptId, result.taskId), (current) => {
        if (!current || current.quizAttemptId !== result.quizAttemptId || current.status !== "IN_PROGRESS") return current;
        return {
          ...current, status: result.status,
          questions: current.questions.map((item) => item.questionId === result.questionId
            ? { ...item, selectedAnswerIds: result.selectedAnswerIds } : item),
        };
      });
    },
    onSettled: () => { pending.current = false; },
  });
  function save(selectedAnswerIds) {
    const current = client.getQueryData(taskQuizKey(runtime.assessmentAttemptId, runtime.taskId));
    if (pending.current || runtime.status !== "IN_PROGRESS" || current?.status !== "IN_PROGRESS" ||
        client.isMutating({ mutationKey: submitKey, exact: true }) > 0) return;
    pending.current = true;
    mutation.mutate({ targetRuntime: runtime, targetQuestion: question, selectedAnswerIds });
  }
  return { save, isPending: mutation.isPending, isSubmitting: submitting, error: mutation.error };
}
