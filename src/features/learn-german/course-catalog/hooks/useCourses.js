import { useQuery } from "@tanstack/react-query";
import { getCourses } from "../services/course.service";

export function useCourses() {
  const {
    data: courses = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  });

  return {
    courses,
    loading,
    error,
  };
}
