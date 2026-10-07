import classNames from "classnames/bind";
import { AppLink } from "@/shared/ui/components/app-link";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);

export default function ActiveAssessments({ assessmentAttempts }) {
  if (assessmentAttempts.length === 0) return null;
  return (
    <section aria-label="Active assessments" className={cx("components")}>
      <h2 className={cx("cardTitle")}>Active assessments</h2>
      {assessmentAttempts.map((attempt) => (
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
