import { useParams } from "react-router-dom";
import classNames from "classnames/bind";
import ResourceState from "@/shared/ui/state/ResourceState";
import { AppLink } from "@/shared/ui/components/app-link";
import AssessmentStructure from "../shared/AssessmentStructure";
import TaskEntry from "../task/TaskEntry";
import FinalSubmission from "./FinalSubmission";
import { assessmentTitle } from "../shared/assessment-presentation";
import { useAssessmentAttempt } from "./hooks/useAssessmentAttempt";
import { attemptStatusLabels, formatAttemptTimestamp } from "./attempt-presentation";
import styles from "../shared/Assessment.module.scss";
import taskStyles from "../task/Task.module.scss";

const cx = classNames.bind(styles);

function AttemptTime({ value, fallback }) {
  return value === null ? fallback : <time dateTime={value}>{formatAttemptTimestamp(value)}</time>;
}

export default function AssessmentAttempt() {
  const { assessmentAttemptId } = useParams();
  const { attempt, definition, error, isLoading, refetch } = useAssessmentAttempt(assessmentAttemptId);
  return (
    <section className={`${cx("page")} ${taskStyles.executionPage}`} aria-label="Lượt làm bài đánh giá">
      <AppLink lang="vi" to="/my-learning">Quay lại việc học của tôi</AppLink>
      <ResourceState loading={isLoading} error={error} errorProps={{
        onRetry: refetch,
        actions: {
          notFound: { to: "/my-learning", label: "Quay lại việc học của tôi" },
          forbidden: { to: "/my-learning", label: "Quay lại việc học của tôi" },
        },
      }}>
        {!error && attempt && definition && (
          <>
            <header className={cx("header")}>
              <h1 className={cx("title")}>{assessmentTitle(definition.title)}</h1>
              <p lang="vi" className={cx("metadata")}>Trình độ mục tiêu: {definition.targetLevel}</p>
              <p lang="vi" className={cx("metadata")}>Trạng thái: {attemptStatusLabels[attempt.status]}</p>
              <p lang="vi" className={cx("metadata")}>Bắt đầu: <AttemptTime value={attempt.startedAt} fallback="Chưa bắt đầu" /></p>
              <p lang="vi" className={cx("metadata")}>Hạn kết thúc: <AttemptTime value={attempt.expiresAt} fallback="Không giới hạn thời gian" /></p>
            </header>
            <AssessmentStructure components={definition.components} renderTaskAction={attempt.status === "IN_PROGRESS"
              ? (task) => <TaskEntry
                key={`${assessmentAttemptId}:${task.taskId}`}
                assessmentAttemptId={assessmentAttemptId}
                taskId={task.taskId}
                bound={attempt.taskAttempts.some((binding) => binding.taskId === task.taskId)}
              /> : undefined} />
            <FinalSubmission key={assessmentAttemptId} attempt={attempt} definition={definition} />
          </>
        )}
      </ResourceState>
    </section>
  );
}
