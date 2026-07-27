import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";

import { enrollCourse } from "../services/enroll.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useEnrollAction(courseId) {
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: enrollCourse,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["my-learning"] });
      navigate(`/my-learning/courses/${courseId}`, { replace: true });
    },
    onError(error) {
      console.log(error);

      alert("Enroll failed");
    },
  });

  async function handleEnroll() {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          redirectTo: `/learn-german/courses/${courseId}`,
        },
      });

      return;
    }

    mutate(courseId);
  }

  return {
    handleEnroll,
    loading: isPending,
    error,
  };
}
