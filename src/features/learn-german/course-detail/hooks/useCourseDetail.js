import { useEffect, useState } from "react";
import { getCourseDetail } from "../services/course-detail.service";

export function useCourseDetail(courseId) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const data = await getCourseDetail(courseId);
        setCourse(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [courseId]);

  return {
    course,
    loading,
    error,
  };
}
