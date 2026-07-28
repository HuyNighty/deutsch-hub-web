import { useQuery } from "@tanstack/react-query";
import { getMyCourse } from "../services/my-learning.service";

function useMyLearning() {
  const {
    data: courses = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-courses"],
    queryFn: getMyCourse,
  });

  return {
    courses,
    loading,
    error,
    refetch,
  };
}

export default useMyLearning;
