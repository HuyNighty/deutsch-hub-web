import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveTaskAnswer, clearTaskAnswer } from "../task.service";
import { taskQuizKey } from "../task-query";

export function useTaskAnswer(runtime, question) {
  const pending = useRef(false);
  const client = useQueryClient();
  const mutation = useMutation({
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
    if (pending.current || runtime.status !== "IN_PROGRESS") return;
    pending.current = true;
    mutation.mutate({ targetRuntime: runtime, targetQuestion: question, selectedAnswerIds });
  }
  return { save, isPending: mutation.isPending, error: mutation.error };
}
