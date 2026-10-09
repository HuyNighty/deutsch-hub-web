import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { ApiError } from "@/shared/api/api-error";
import { getSessionGeneration, isCurrentSession } from "@/shared/auth/auth-session";
import { learningJourneyKey } from "@/features/assessment/attempt/hooks/useLearningJourney";
import { learningDirectionKey } from "@/features/my-learning/guidance/hooks/useLearningDirection";
import { nextActivityKey } from "@/features/my-learning/guidance/hooks/useNextActivity";
import { enrollCourse } from "../services/enroll.service";
import { getViewerCourseDetail } from "../services/course-detail.service";

const uncertainMessage = "We couldn't confirm your enrollment. It may still complete. Check your enrollment status again.";
const accessibleStatuses = ["ENROLLED", "IN_PROGRESS", "COMPLETED"];

function failureMessage(status) {
  if (status === 401) return "Your session could not be verified. Please sign in again.";
  if (status === 403) return "You do not have permission to enroll in this course.";
  if (status === 404 || status === 410) return "This course is unavailable for enrollment.";
  if (status === 400 || status === 422) return "Enrollment could not be submitted. Please check the course details and try again.";
  if (status === 409) return "Enrollment could not be completed because the course state changed.";
  return "Enrollment could not be completed. Please try again.";
}

export function useEnrollAction(courseId) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const generation = getSessionGeneration();
  const currentCourse = useRef(courseId);
  currentCourse.current = courseId;
  const operation = useRef(null);
  const [state, setState] = useState(null);
  const mutationKey = ["course-enrollment", courseId, generation];

  const owns = (attempt) => operation.current === attempt &&
    isCurrentSession(attempt.generation) && currentCourse.current === attempt.courseId;

  function update(attempt, phase, error = null) {
    if (!owns(attempt)) return;
    attempt.phase = phase;
    setState({ courseId: attempt.courseId, generation: attempt.generation, phase, error });
  }

  useEffect(() => () => {
    const attempt = operation.current;
    if (attempt?.courseId === courseId && attempt.generation === generation) {
      operation.current = null;
      attempt.controller.abort();
    }
  }, [courseId, generation]);

  async function readEnrollment(attempt) {
    if (!owns(attempt)) return null;
    update(attempt, "checking");
    try {
      // Read directly, not through query-cache success or automatic query retries.
      const viewer = await getViewerCourseDetail(attempt.courseId, {
        _sessionGeneration: attempt.generation,
        signal: attempt.controller.signal,
        refreshOnUnauthorized: false,
        headers: { "Cache-Control": "no-cache" },
      });
      if (!owns(attempt)) return null;
      if (viewer?.id === attempt.courseId && viewer.enrolled === true) {
        if (accessibleStatuses.includes(viewer.enrollmentStatus)) return { phase: "confirmed" };
        if (["DROPPED", "EXPIRED"].includes(viewer.enrollmentStatus)) {
          return { phase: "unavailable", error: new ApiError({
            message: `Your enrollment is ${viewer.enrollmentStatus.toLowerCase()}. Course access is unavailable.`,
          }) };
        }
      }
    } catch {
      // A failed or negative read cannot prove that an earlier POST will never commit.
    }
    return { phase: "uncertain", error: new ApiError({ message: uncertainMessage }) };
  }

  async function confirm(attempt) {
    update(attempt, "confirmed");
    const filters = [
      { queryKey: ["courses", attempt.courseId], exact: true },
      { queryKey: ["my-courses"] },
      { queryKey: learningJourneyKey, exact: true },
      { queryKey: learningDirectionKey, exact: true },
      { queryKey: nextActivityKey, exact: true },
    ];
    // Discard pre-enrollment reads before marking these existing caches stale.
    await Promise.all(filters.map((filter) => queryClient.cancelQueries(filter)));
    for (const filter of filters) {
      if (!owns(attempt)) return;
      void queryClient.invalidateQueries({ ...filter, refetchType: "none" });
    }
    if (owns(attempt)) navigate(`/my-learning/courses/${attempt.courseId}`, { replace: true });
  }

  const mutation = useMutation({
    mutationKey,
    retry: false,
    mutationFn: async (attempt) => {
      if (!owns(attempt)) return null;
      if (attempt.kind === "check") return readEnrollment(attempt);
      try {
        await enrollCourse(attempt.courseId, { _sessionGeneration: attempt.generation });
        return { phase: "confirmed" };
      } catch (error) {
        if (!owns(attempt)) return null;
        const duplicate = error.status === 409 && error.code === 50004;
        const unknown = error.status == null || error.status === 408 || error.status >= 500;
        if (duplicate || unknown) return readEnrollment(attempt);
        return { phase: "failed", error: new ApiError({
          status: error.status, code: error.code, message: failureMessage(error.status),
        }) };
      }
    },
    onSuccess: async (outcome, attempt) => {
      if (!owns(attempt) || !outcome) return;
      if (outcome.phase === "confirmed") await confirm(attempt);
      else update(attempt, outcome.phase, outcome.error);
    },
    onError: (_, attempt) => {
      update(attempt, "uncertain", new ApiError({ message: uncertainMessage }));
    },
  });

  function start(kind) {
    const attempt = { courseId, generation, kind, controller: new AbortController() };
    operation.current = attempt; // Synchronous fence, before React's pending render.
    update(attempt, kind === "check" ? "checking" : "enrolling");
    mutation.mutate(attempt);
  }

  function handleEnroll() {
    if (!isCurrentSession(generation) || currentCourse.current !== courseId) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { returnTo: `/learn-german/courses/${courseId}` } });
      return;
    }
    if ((operation.current && owns(operation.current) && operation.current.phase !== "failed") ||
        queryClient.isMutating({ mutationKey, exact: true }) > 0) return;
    start("enroll");
  }

  function checkEnrollment() {
    if (!isAuthenticated || !isCurrentSession(generation) || currentCourse.current !== courseId || !operation.current ||
        !owns(operation.current) || !["uncertain", "unavailable"].includes(operation.current.phase) ||
        queryClient.isMutating({ mutationKey, exact: true }) > 0) return;
    start("check");
  }

  const current = state?.generation === generation && state.courseId === courseId ? state : null;
  const phase = current?.phase ?? "idle";
  return {
    handleEnroll,
    checkEnrollment,
    phase,
    loading: ["enrolling", "checking", "confirmed"].includes(phase),
    canCheckEnrollment: ["uncertain", "unavailable"].includes(phase),
    error: current?.error ?? null,
  };
}
