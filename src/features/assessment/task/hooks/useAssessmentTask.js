import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { useAttemptDefinition } from "../../attempt/hooks/useAttemptDefinition";
import { getTaskRuntime } from "../task.service";
import { taskQuizKey } from "../task-query";

export function useAssessmentTask(assessmentAttemptId, taskId) {
  const runtime = useQuery({
    queryKey: taskQuizKey(assessmentAttemptId, taskId),
    queryFn: () => getTaskRuntime(assessmentAttemptId, taskId),
    enabled: Boolean(assessmentAttemptId && taskId),
  });
  const definition = useAttemptDefinition(assessmentAttemptId);
  const component = definition.data?.components.find((item) => item.tasks.some((task) => task.taskId === taskId));
  const task = component?.tasks.find((item) => item.taskId === taskId);
  const error = runtime.error || definition.error || (runtime.data && definition.data && !task
    ? new ApiError({ message: "The task does not belong to the assessment definition." }) : null);
  return {
    runtime: runtime.data, definition: definition.data, component, task, error,
    isLoading: !error && (runtime.isLoading || definition.isLoading),
    refetch: () => Promise.all([runtime.refetch(), definition.refetch()]),
  };
}
