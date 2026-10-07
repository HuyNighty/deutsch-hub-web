import { useParams } from "react-router-dom";
import classNames from "classnames/bind";
import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import { assessmentTitle, skillLabels } from "../shared/assessment-presentation";
import { formatAttemptTimestamp } from "../attempt/attempt-presentation";
import { useAssessmentTask } from "./hooks/useAssessmentTask";
import { taskStatusLabels } from "./task-presentation";
import TaskQuestion from "./TaskQuestion";
import TaskSubmission from "./TaskSubmission";
import styles from "../shared/Assessment.module.scss";

const cx = classNames.bind(styles);

export default function AssessmentTask() {
  const { assessmentAttemptId, taskId } = useParams();
  const { runtime, definition, component, task, error, isLoading, refetch } = useAssessmentTask(assessmentAttemptId, taskId);
  const parentRoute = `/my-learning/assessment-attempts/${encodeURIComponent(assessmentAttemptId)}`;
  return (
    <section className={cx("page")} aria-label="Assessment task">
      <AppLink to={parentRoute}>Back to Assessment</AppLink>
      <ResourceState loading={isLoading} error={error} errorProps={{
        onRetry: refetch,
        actions: {
          notFound: { to: parentRoute, label: "Return to Assessment" },
          forbidden: { to: parentRoute, label: "Return to Assessment" },
        },
      }}>
        {!error && runtime && definition && task && (
          <>
            <header className={cx("header")}>
              <h1 className={cx("title")}>{assessmentTitle(definition.title)}</h1>
              <p className={cx("metadata")}>{skillLabels[component.skillDimension]}</p>
              <h2 className={cx("cardTitle")}>Task {task.order}</h2>
              <p className={cx("metadata")}>Status: {taskStatusLabels[runtime.status]}</p>
              <p className={cx("metadata")}>Deadline: {runtime.expiresAt === null
                ? "No time limit"
                : <time dateTime={runtime.expiresAt}>{formatAttemptTimestamp(runtime.expiresAt)}</time>}</p>
            </header>
            <div className={cx("components")}>
              {runtime.questions.map((question) => <TaskQuestion
                key={`${runtime.quizAttemptId}:${question.questionId}`} runtime={runtime} question={question}
              />)}
            </div>
            <TaskSubmission key={runtime.quizAttemptId} runtime={runtime} parentRoute={parentRoute} />
          </>
        )}
      </ResourceState>
    </section>
  );
}
