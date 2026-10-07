import { completeLesson } from "../services/lesson-complete.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { learningJourneyKey } from "@/features/assessment/attempt/hooks/useLearningJourney";
import { learningDirectionKey } from "@/features/my-learning/guidance/hooks/useLearningDirection";

function useCompleteLesson() {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ courseId, lessonId, studyMinutes }) =>
      completeLesson(courseId, lessonId, studyMinutes),
    onSuccess(data, { courseId }) {
      queryClient.invalidateQueries({
        queryKey: ["my-courses"],
      });
      queryClient.invalidateQueries({ queryKey: ["my-courses", courseId] });
      queryClient.invalidateQueries({ queryKey: learningJourneyKey, exact: true, refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: learningDirectionKey, exact: true, refetchType: "none" });
    },
    onError(error) {
      console.log(error);
    },
  });

  function handleComplete(courseId, lessonId, studyMinutes) {
    return mutateAsync({ courseId, lessonId, studyMinutes });
  }
  return { loading: isPending, error, handleComplete };
}

export default useCompleteLesson;
