import { useParams } from "react-router-dom";
import classNames from "classnames/bind";
import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import { useLearnerAssessment } from "./hooks/useLearnerAssessment";
import AssessmentEntry from "./AssessmentEntry";
import AssessmentStructure from "../shared/AssessmentStructure";
import {
  assessmentTitle,
  assessmentTimeLimit,
} from "../shared/assessment-presentation";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);

export default function AssessmentDetail() {
  const { assessmentId } = useParams();
  const { data: assessment, isLoading, error, refetch } = useLearnerAssessment(assessmentId);

  return (
    <section className={cx("page")} aria-label="Assessment detail">
      <AppLink to="/my-learning/assessments">Back to Assessments</AppLink>
      <ResourceState
        loading={isLoading}
        error={error}
        errorProps={{
          onRetry: refetch,
          actions: {
            notFound: { to: "/my-learning/assessments", label: "Browse assessments" },
          },
        }}
      >
        {assessment && (
          <>
            <header className={cx("header")}>
              <h1 className={cx("title")}>{assessmentTitle(assessment.title)}</h1>
              <p className={cx("metadata")}>Target level: {assessment.targetLevel}</p>
              <p className={cx("metadata")}>Time limit: {assessmentTimeLimit(assessment.timeLimitMinutes)}</p>
            </header>
            <AssessmentEntry assessmentId={assessmentId} />
            <AssessmentStructure components={assessment.components} />
          </>
        )}
      </ResourceState>
    </section>
  );
}
