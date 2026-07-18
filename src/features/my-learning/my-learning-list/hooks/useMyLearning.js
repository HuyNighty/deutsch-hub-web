import { useEffect, useState } from "react";
import { getMyCourse } from "../services/my-learning.service";

function useMyLearning() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const data = await getMyCourse();

        setCourses(data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  return { courses, loading, error };
}

export default useMyLearning;
