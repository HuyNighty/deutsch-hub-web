import classNames from "classnames/bind";
import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";
import { useLearningJourney } from "./hooks/useLearningJourney";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);

export default function ActiveAssessments() {
  const journey = useLearningJourney();
  if (!journey.isPending && !journey.error && journey.data.assessmentAttempts.length === 0) return null;
  return (
    <section aria-label="Active assessments" className={cx("components")}>
      <h2 className={cx("cardTitle")}>Active assessments</h2>
      {journey.isPending ? <p role="status">Checking assessment attempts...</p>
        : journey.error ? (
          <>
            <p role="alert">Unable to load active assessments.</p>
            <Button onClick={() => journey.refetch()}>Retry active assessments</Button>
          </>
        ) : journey.data.assessmentAttempts.map((attempt) => (
          <article key={attempt.assessmentAttemptId} className={cx("card")}>
            <h3 className={cx("cardTitle")}>Assessment in progress</h3>
            <p className={cx("metadata")}>Target level: {attempt.targetLevel}</p>
            <AppLink to={`/my-learning/assessment-attempts/${encodeURIComponent(attempt.assessmentAttemptId)}`}>
              Continue assessment
            </AppLink>
          </article>
        ))}
    </section>
  );
}
