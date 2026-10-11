import classNames from "classnames/bind";
import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";
import { useStartTask } from "./hooks/useStartTask";
import { taskRoute } from "./task-query";
import { assessmentExecutionError } from "../shared/assessment-execution-error";
import styles from "./Task.module.scss";

const cx = classNames.bind(styles);

export default function TaskEntry({ assessmentAttemptId, taskId, bound }) {
  const mutation = useStartTask(assessmentAttemptId, taskId);
  if (bound) return <AppLink lang="vi" className={cx("taskAction")} to={taskRoute(assessmentAttemptId, taskId)}>Tiếp tục bài tập</AppLink>;
  return (
    <span lang="vi" className={cx("taskAction")}>
      <Button onClick={mutation.start} loading={mutation.isPending} disabled={mutation.isFinalSubmitting}>Bắt đầu bài tập</Button>
      {mutation.error && <span role="alert">{assessmentExecutionError(mutation.error, "start")}</span>}
    </span>
  );
}
