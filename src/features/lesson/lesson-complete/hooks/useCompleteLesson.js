import { useState } from "react";
import { completeLesson } from "../services/lesson-complete.service";

function useCompleteLesson() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleComplete(courseId, lessonId, studyMinutes) {
    try {
      setLoading(true);
      setError(null);
      await completeLesson(courseId, lessonId, studyMinutes);

      return true;
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }
  return { loading, error, handleComplete };
}

export default useCompleteLesson;
