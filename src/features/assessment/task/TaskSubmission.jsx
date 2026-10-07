import classNames from "classnames/bind";
import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";
import { formatAttemptTimestamp } from "../attempt/attempt-presentation";
import { useSubmitTask } from "./hooks/useSubmitTask";
import styles from "./Task.module.scss";

const cx = classNames.bind(styles);

export default function TaskSubmission({ runtime, parentRoute }) {
  const mutation = useSubmitTask(runtime);
  if (runtime.status === "SUBMITTED") {
    return (
      <section aria-label="Task submission" className={cx("submission")}>
        <p>Submitted: <time dateTime={runtime.submittedAt}>{formatAttemptTimestamp(runtime.submittedAt)}</time></p>
        <AppLink to={parentRoute} variant="primary">Continue assessment</AppLink>
      </section>
    );
  }
  if (runtime.status !== "IN_PROGRESS") return null;
  return (
    <section aria-label="Task submission" className={cx("submission")}>
      <Button onClick={mutation.submit} loading={mutation.isPending} disabled={mutation.answering}>Submit task</Button>
      {mutation.error && <p role="alert">{mutation.error.message}</p>}
    </section>
  );
}
