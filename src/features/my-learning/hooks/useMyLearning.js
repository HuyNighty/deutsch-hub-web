import { useQuery } from "@tanstack/react-query";
import { getMyCourse } from "../services/my-learning.service";

function useMyLearning() {
  const {
    data: courses = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["my-courses"],
    queryFn: getMyCourse,
  });

  return {
    courses,
    loading,
    error,
  };
}

export default useMyLearning;
