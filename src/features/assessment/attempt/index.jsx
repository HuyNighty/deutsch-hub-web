import { useParams } from "react-router-dom";
import classNames from "classnames/bind";
import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import AssessmentStructure from "../shared/AssessmentStructure";
import { assessmentTitle } from "../shared/assessment-presentation";
import { useAssessmentAttempt } from "./hooks/useAssessmentAttempt";
import { attemptStatusLabels, formatAttemptTimestamp } from "./attempt-presentation";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);

function AttemptTime({ value, fallback }) {
  return value === null ? fallback : <time dateTime={value}>{formatAttemptTimestamp(value)}</time>;
}

export default function AssessmentAttempt() {
  const { assessmentAttemptId } = useParams();
  const { attempt, definition, error, isLoading, refetch } = useAssessmentAttempt(assessmentAttemptId);
  return (
    <section className={cx("page")} aria-label="Assessment attempt">
      <AppLink to="/my-learning">Back to My Learning</AppLink>
      <ResourceState loading={isLoading} error={error} errorProps={{
        onRetry: refetch,
        actions: {
          notFound: { to: "/my-learning", label: "Back to My Learning" },
          forbidden: { to: "/my-learning", label: "Back to My Learning" },
        },
      }}>
        {!error && attempt && definition && (
          <>
            <header className={cx("header")}>
              <h1 className={cx("title")}>{assessmentTitle(definition.title)}</h1>
              <p className={cx("metadata")}>Target level: {definition.targetLevel}</p>
              <p className={cx("metadata")}>Status: {attemptStatusLabels[attempt.status]}</p>
              <p className={cx("metadata")}>Started: <AttemptTime value={attempt.startedAt} fallback="Not started" /></p>
              <p className={cx("metadata")}>Deadline: <AttemptTime value={attempt.expiresAt} fallback="No time limit" /></p>
            </header>
            <AssessmentStructure components={definition.components} />
          </>
        )}
      </ResourceState>
    </section>
  );
}
