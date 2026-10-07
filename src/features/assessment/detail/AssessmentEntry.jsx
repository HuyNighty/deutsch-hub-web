import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";
import { useLearningJourney } from "../attempt/hooks/useLearningJourney";
import { useStartAssessment } from "../attempt/hooks/useStartAssessment";

export default function AssessmentEntry({ assessmentId }) {
  const journey = useLearningJourney();
  const start = useStartAssessment(assessmentId);

  return (
    <section aria-label="Assessment entry">
      {start.error && <p role="alert">{start.error.message}</p>}
      {journey.isPending || journey.isFetching ? (
        <p role="status">Checking assessment attempts...</p>
      ) : journey.error ? (
        <>
          <p role="alert">Unable to check assessment attempts.</p>
          <Button onClick={() => journey.refetch()}>Retry assessment check</Button>
        </>
      ) : (
        <AssessmentAction
          existing={journey.data.assessmentAttempts.find((attempt) => attempt.assessmentId === assessmentId)}
          start={start}
        />
      )}
    </section>
  );
}

function AssessmentAction({ existing, start }) {
  if (existing) {
    return <AppLink to={`/my-learning/assessment-attempts/${encodeURIComponent(existing.assessmentAttemptId)}`}>
      Continue Assessment
    </AppLink>;
  }
  return <Button onClick={start.start} loading={start.isPending}>Start Assessment</Button>;
}
