import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import { useLearningDirection } from "./hooks/useLearningDirection";
import { useNextActivity } from "./hooks/useNextActivity";
import { taskRoute } from "@/features/assessment/task/task-query";

function Direction({ direction }) {
  switch (direction.type) {
    case "RESUME_ASSESSMENT":
      return (
        <>
          <p>You have an assessment in progress.</p>
          <AppLink to={`/my-learning/assessment-attempts/${encodeURIComponent(direction.target.assessmentAttemptId)}`} variant="outline">
            Continue assessment
          </AppLink>
        </>
      );
    case "CONTINUE_COURSE":
      return (
        <>
          <p>Continue the course you are currently working on.</p>
          <AppLink to={`/my-learning/courses/${encodeURIComponent(direction.target.courseId)}`} variant="outline">
            Continue course
          </AppLink>
        </>
      );
    case "DISCOVER_COURSE":
      return (
        <>
          <p>Choose a course to begin or continue your German learning.</p>
          <AppLink to="/learn-german" variant="outline">Explore courses</AppLink>
        </>
      );
  }
}

function Activity({ activity }) {
  switch (activity.type) {
    case "OPEN_LESSON":
      return (
        <>
          <p>Continue with your next lesson.</p>
          <AppLink to={`/my-learning/courses/${encodeURIComponent(activity.target.courseId)}/lessons/${encodeURIComponent(activity.target.lessonId)}`} variant="outline">
            Open next lesson
          </AppLink>
        </>
      );
    case "RESUME_ASSESSMENT_TASK":
      return (
        <>
          <p>Resume the assessment task already in progress.</p>
          <AppLink to={taskRoute(activity.target.assessmentAttemptId, activity.target.taskId)} variant="outline">
            Resume task
          </AppLink>
        </>
      );
    case "OPEN_ASSESSMENT":
      return (
        <>
          <p>Return to your assessment to continue.</p>
          <AppLink to={`/my-learning/assessment-attempts/${encodeURIComponent(activity.target.assessmentAttemptId)}`} variant="outline">
            Open assessment
          </AppLink>
        </>
      );
  }
}

export default function LearningGuidance() {
  const direction = useLearningDirection();
  const activity = useNextActivity();
  const concrete = !activity.error && activity.data?.type !== "NONE" && activity.data;
  const fallback = !direction.error && direction.data;
  return (
    <section aria-label="Learning guidance">
      <h2>Learning guidance</h2>
      <ResourceState
        loading={!concrete && !fallback && (direction.isPending || activity.isPending)}
        loadingProps={{ children: <p>Loading learning guidance...</p> }}
      >
        {concrete ? <Activity activity={concrete} /> : fallback && <Direction direction={fallback} />}
      </ResourceState>
      {!concrete && direction.error && (
        <div role="region" aria-label="Learning direction">
          <ResourceState error={direction.error} errorProps={{ onRetry: direction.refetch }} />
        </div>
      )}
      {activity.error && (
        <div role="region" aria-label="Next activity">
          <ResourceState error={activity.error} errorProps={{ onRetry: activity.refetch }} />
        </div>
      )}
    </section>
  );
}
