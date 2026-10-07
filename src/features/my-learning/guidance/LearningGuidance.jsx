import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import { useLearningDirection } from "./hooks/useLearningDirection";

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

export default function LearningGuidance() {
  const { data, isPending, error, refetch } = useLearningDirection();
  return (
    <section aria-label="Learning direction">
      <h2>Learning direction</h2>
      <ResourceState
        loading={isPending}
        loadingProps={{ children: <p>Loading learning direction...</p> }}
        error={error}
        errorProps={{ onRetry: refetch }}
      >
        {data && <Direction direction={data} />}
      </ResourceState>
    </section>
  );
}
