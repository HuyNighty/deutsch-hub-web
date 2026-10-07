import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { startAssessment } from "../attempt.service";
import { learningJourneyKey, learningJourneyOptions } from "./useLearningJourney";
import { learningDirectionKey } from "@/features/my-learning/guidance/hooks/useLearningDirection";

export function useStartAssessment(assessmentId) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pending = useRef(false);
  const mutation = useMutation({
    retry: false,
    mutationFn: async () => {
      try {
        const attempt = await startAssessment(assessmentId);
        return { attemptId: attempt.id, created: true };
      } catch (error) {
        if (error.status !== 409) throw error;
        // Cancel any older read, then force exactly one fresh read into the canonical cache.
        await queryClient.cancelQueries({ queryKey: learningJourneyKey, exact: true });
        await queryClient.invalidateQueries({
          queryKey: learningJourneyKey, exact: true, refetchType: "none",
        });
        try {
          const journey = await queryClient.fetchQuery({ ...learningJourneyOptions, staleTime: 0 });
          const existing = journey.assessmentAttempts.find((attempt) => attempt.assessmentId === assessmentId);
          if (existing) return { attemptId: existing.assessmentAttemptId, created: false };
        } catch {
          // Recovery cannot replace the original Start error.
        }
        throw error;
      }
    },
    onSuccess: ({ attemptId, created }) => {
      if (created) {
        void queryClient.invalidateQueries({
          queryKey: learningJourneyKey, exact: true, refetchType: "none",
        });
      }
      void queryClient.invalidateQueries({ queryKey: learningDirectionKey, exact: true, refetchType: "none" });
      navigate(`/my-learning/assessment-attempts/${encodeURIComponent(attemptId)}`);
    },
    onSettled: () => { pending.current = false; },
  });

  function start() {
    if (pending.current) return;
    pending.current = true;
    mutation.mutate();
  }

  return { start, isPending: mutation.isPending, error: mutation.error };
}
