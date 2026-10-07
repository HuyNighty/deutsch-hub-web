import { useParams } from "react-router-dom";
import classNames from "classnames/bind";
import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import { useLearnerAssessment } from "./hooks/useLearnerAssessment";
import {
  assessmentTitle,
  assessmentTimeLimit,
  skillLabels,
  executionModeLabels,
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
            <div className={cx("components")}>
              {assessment.components.map((component) => (
                <section className={cx("card")} key={component.componentId}>
                  <h2 className={cx("cardTitle")}>{skillLabels[component.skillDimension]}</h2>
                  <p className={cx("metadata")}>Execution mode: {executionModeLabels[component.executionMode]}</p>
                  <ul className={cx("tasks")}>
                    {component.tasks.map((task) => (
                      <li key={task.taskId}>Task {task.order}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </ResourceState>
    </section>
  );
}
