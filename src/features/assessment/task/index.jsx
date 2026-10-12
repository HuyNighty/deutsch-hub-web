import { useId } from "react";
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
import taskStyles from "./Task.module.scss";

const cx = classNames.bind(styles);

export default function AssessmentTask() {
  const regionLabelId = useId();
  const { assessmentAttemptId, taskId } = useParams();
  const { runtime, definition, component, task, error, isLoading, refetch } = useAssessmentTask(assessmentAttemptId, taskId);
  const parentRoute = `/my-learning/assessment-attempts/${encodeURIComponent(assessmentAttemptId)}`;
  return (
    <section className={`${cx("page")} ${taskStyles.executionPage}`} aria-labelledby={regionLabelId}>
      <AppLink lang="vi" to={parentRoute}>Quay lại bài đánh giá</AppLink>
      <ResourceState loading={isLoading} error={error} errorProps={{
        onRetry: refetch,
        actions: {
          notFound: { to: parentRoute, label: <span lang="vi">Quay lại bài đánh giá</span> },
          forbidden: { to: parentRoute, label: <span lang="vi">Quay lại bài đánh giá</span> },
        },
      }}>
        {!error && runtime && definition && task && (
          <>
            <header className={cx("header")}>
              <h1 className={cx("title")}>{assessmentTitle(definition.title)}</h1>
              <p lang="vi" className={cx("metadata")}>{skillLabels[component.skillDimension]}</p>
              <h2 lang="vi" className={cx("cardTitle")}>Bài tập {task.order}</h2>
              <p lang="vi" className={cx("metadata")}>Trạng thái: {taskStatusLabels[runtime.status]}</p>
              <p lang="vi" className={cx("metadata")}>Hạn kết thúc: {runtime.expiresAt === null
                ? "Không giới hạn thời gian"
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
      <span id={regionLabelId} lang="vi" hidden>Bài tập đánh giá</span>
    </section>
  );
}
