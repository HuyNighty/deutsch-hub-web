import classNames from "classnames/bind";
import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";
import { formatAttemptTimestamp } from "../attempt/attempt-presentation";
import { useSubmitTask } from "./hooks/useSubmitTask";
import { assessmentExecutionError } from "../shared/assessment-execution-error";
import styles from "./Task.module.scss";

const cx = classNames.bind(styles);

export default function TaskSubmission({ runtime, parentRoute }) {
  const mutation = useSubmitTask(runtime);
  if (runtime.status === "SUBMITTED") {
    return (
      <section lang="vi" aria-label="Nộp bài tập" className={cx("submission")}>
        <p>Đã nộp: <time dateTime={runtime.submittedAt}>{formatAttemptTimestamp(runtime.submittedAt)}</time></p>
        <AppLink to={parentRoute} variant="primary">Tiếp tục bài đánh giá</AppLink>
      </section>
    );
  }
  if (runtime.status !== "IN_PROGRESS") return null;
  return (
    <section lang="vi" aria-label="Nộp bài tập" className={cx("submission")}>
      <Button onClick={mutation.submit} loading={mutation.isPending} disabled={mutation.answering || mutation.finalizing}>Nộp bài tập</Button>
      {mutation.error && <p role="alert">{assessmentExecutionError(mutation.error, "taskSubmit")}</p>}
    </section>
  );
}
