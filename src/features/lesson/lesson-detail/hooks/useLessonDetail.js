import { useEffect, useState } from "react";
import { getLessonDetail } from "../services/lesson-detail.service";

export default function useLessonDetail(courseId, lessonId) {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId || !lessonId) return;

    async function fetchLesson() {
      try {
        setLoading(true);

        const data = await getLessonDetail(courseId, lessonId);

        setLesson(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [courseId, lessonId]);

  return {
    lesson,
    loading,
    error,
  };
}
