import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/context/AuthProvider";

import { enrollCourse } from "../services/enroll.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { learningJourneyKey } from "@/features/assessment/attempt/hooks/useLearningJourney";
import { learningDirectionKey } from "@/features/my-learning/guidance/hooks/useLearningDirection";

export function useEnrollAction(courseId) {
  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: enrollCourse,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      queryClient.invalidateQueries({ queryKey: learningJourneyKey, exact: true, refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: learningDirectionKey, exact: true, refetchType: "none" });
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
          returnTo: `/learn-german/courses/${courseId}`,
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
