import { completeLesson } from "../services/lesson-complete.service";
import { useMutation } from "@tanstack/react-query";

function useCompleteLesson() {
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: ({ courseId, lessonId, studyMinutes }) =>
      completeLesson(courseId, lessonId, studyMinutes),
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
