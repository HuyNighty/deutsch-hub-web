import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { ApiError } from "@/shared/api/api-error";
import { getSessionGeneration, isCurrentSession } from "@/shared/auth/auth-session";
import { learningJourneyKey } from "@/features/assessment/attempt/hooks/useLearningJourney";
import { learningDirectionKey } from "@/features/my-learning/guidance/hooks/useLearningDirection";
import { nextActivityKey } from "@/features/my-learning/guidance/hooks/useNextActivity";
import { getLessonDetail } from "../../lesson-detail/services/lesson-detail.service";
import { completeLesson } from "../services/lesson-complete.service";

const uncertainMessage = "Chưa thể xác nhận bài học đã hoàn thành. Yêu cầu có thể đã được ghi nhận. Vui lòng kiểm tra trạng thái hoàn thành.";

function failureMessage(error) {
  if (error.status === 401) return "Không thể xác minh phiên đăng nhập của bạn. Vui lòng đăng nhập lại.";
  if (error.status === 403) return "Bạn không có quyền hoàn thành bài học này.";
  if (error.status === 404 || error.status === 410) return "Bài học này không còn khả dụng.";
  if (error.status === 409 && error.code === 8005) return "Đăng ký khóa học của bạn không còn hiệu lực. Không thể hoàn thành bài học này.";
  if (error.status === 409) return "Không thể ghi nhận hoàn thành vì trạng thái bài học hoặc đăng ký khóa học đã thay đổi.";
  return "Không thể hoàn thành bài học. Vui lòng kiểm tra bài học và thử lại.";
}

function useCompleteLesson(courseId, lessonId, onCompleted) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const generation = getSessionGeneration();
  const mounted = useRef(false);
  const location = useRef(null);
  location.current = { courseId, lessonId, generation };
  const operation = useRef(null);
  const [state, setState] = useState(null);
  const mutationKey = ["lesson-completion", courseId, lessonId, generation];
  const matchesLocation = (attempt) => mounted.current && attempt.courseId === location.current.courseId &&
    attempt.lessonId === location.current.lessonId && isCurrentSession(attempt.generation);
  const owns = (attempt) => operation.current === attempt && matchesLocation(attempt);

  function update(attempt, phase, error = null) {
    if (!owns(attempt)) return;
    attempt.phase = phase;
    setState({ courseId, lessonId, generation: attempt.generation, phase, error });
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const attempt = operation.current;
      if (attempt?.courseId === courseId && attempt.lessonId === lessonId && attempt.generation === generation) {
        operation.current = null;
        attempt.controller.abort();
      }
    };
  }, [courseId, lessonId, generation]);

  async function check(attempt) {
    if (!owns(attempt)) return false;
    update(attempt, "checking");
    try {
      // Canonical evidence must come from a fresh request, never a cached snapshot.
      const lesson = await getLessonDetail(attempt.courseId, attempt.lessonId, {
        _sessionGeneration: attempt.generation,
        signal: attempt.controller.signal,
        refreshOnUnauthorized: false,
        headers: { "Cache-Control": "no-cache" },
      });
      return owns(attempt) && lesson?.id === attempt.lessonId && lesson.completed === true;
    } catch {
      return false;
    }
  }

  const mutation = useMutation({
    mutationKey,
    retry: false,
    mutationFn: async (attempt) => {
      if (!owns(attempt)) return false;
      if (attempt.checkOnly) return check(attempt);
      try {
        await completeLesson(attempt.courseId, attempt.lessonId, attempt.studyMinutes, {
          _sessionGeneration: attempt.generation,
        });
        return true;
      } catch (error) {
        if (!owns(attempt)) return false;
        if ((error.status === 409 && error.code === 6010) ||
            error.status == null || error.status === 408 || error.status >= 500) return check(attempt);
        throw new ApiError({ status: error.status, code: error.code, message: failureMessage(error) });
      }
    },
    onSuccess: async (confirmed, attempt) => {
      if (!owns(attempt)) return;
      if (!confirmed) {
        update(attempt, "uncertain", new ApiError({ message: uncertainMessage }));
        return;
      }
      const lessonKey = ["courses", attempt.courseId, "lessons", attempt.lessonId];
      const filters = [
        { queryKey: lessonKey, exact: true },
        { queryKey: ["courses", attempt.courseId], exact: true },
        { queryKey: ["my-courses"] },
        { queryKey: learningJourneyKey, exact: true },
        { queryKey: learningDirectionKey, exact: true },
        { queryKey: nextActivityKey, exact: true },
      ];
      // Cancel older reads before publishing confirmation; keep content/navigation intact.
      await Promise.all(filters.map((filter) => queryClient.cancelQueries(filter)));
      if (!owns(attempt)) return;
      queryClient.setQueryData(lessonKey, (lesson) => lesson?.id === attempt.lessonId
        ? { ...lesson, completed: true } : lesson);
      for (const filter of filters) {
        if (!owns(attempt)) return;
        void queryClient.invalidateQueries({ ...filter, refetchType: "none" });
      }
      update(attempt, "confirmed");
      if (owns(attempt)) onCompleted?.();
    },
    onError: (error, attempt) => {
      update(attempt, "failed", new ApiError({ message: failureMessage(error), status: error.status, code: error.code }));
    },
  });

  function start(checkOnly, studyMinutes) {
    if (!isAuthenticated || !matchesLocation({ courseId, lessonId, generation }) ||
        queryClient.isMutating({ mutationKey, exact: true }) > 0) return;
    const previous = operation.current;
    if (checkOnly ? !previous || !owns(previous) || previous.phase !== "uncertain"
      : previous && owns(previous) && previous.phase !== "failed") return;
    const attempt = { courseId, lessonId, generation, checkOnly, studyMinutes, controller: new AbortController() };
    operation.current = attempt; // Lock synchronously before React renders pending UI.
    update(attempt, checkOnly ? "checking" : "submitting");
    mutation.mutate(attempt); // No rejecting promise escapes a production click handler.
  }

  const current = state?.courseId === courseId && state.lessonId === lessonId && state.generation === generation ? state : null;
  const phase = current?.phase ?? "idle";
  return {
    handleComplete: (studyMinutes) => start(false, studyMinutes),
    checkCompletion: () => start(true),
    phase,
    loading: ["submitting", "checking"].includes(phase),
    uncertain: phase === "uncertain",
    error: current?.error ?? null,
  };
}

export default useCompleteLesson;
