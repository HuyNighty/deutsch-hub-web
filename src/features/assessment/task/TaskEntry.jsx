import classNames from "classnames/bind";
import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";
import { useStartTask } from "./hooks/useStartTask";
import { taskRoute } from "./task-query";
import styles from "./Task.module.scss";

const cx = classNames.bind(styles);

export default function TaskEntry({ assessmentAttemptId, taskId, bound }) {
  const mutation = useStartTask(assessmentAttemptId, taskId);
  if (bound) return <AppLink className={cx("taskAction")} to={taskRoute(assessmentAttemptId, taskId)}>Continue task</AppLink>;
  return (
    <span className={cx("taskAction")}>
      <Button onClick={mutation.start} loading={mutation.isPending} disabled={mutation.isFinalSubmitting}>Start task</Button>
      {mutation.error && <span role="alert">{mutation.error.message}</span>}
    </span>
  );
}
