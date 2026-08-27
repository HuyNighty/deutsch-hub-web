import { Button } from "@/shared/ui/components/button";
import useCompleteLesson from "../hooks/useCompleteLesson";

import classNames from "classnames/bind";
import styles from "./CompleteLessonButton.module.scss";

const cx = classNames.bind(styles);

export default function CompleteLessonButton({
  courseId,
  lesson,
  onCompleted,
}) {
  const { id, completed, estimatedMinutes } = lesson;

  const { loading, error, handleComplete } = useCompleteLesson();

  const handleClick = async () => {
    const success = await handleComplete(courseId, id, estimatedMinutes);

    if (success) {
      onCompleted();
    }
  };

  if (completed) {
    return (
      <div className={cx("completed")}>
        <span className={cx("icon")} aria-hidden="true">
          ✓
        </span>

        <div className={cx("content")}>
          <strong>Lesson completed</strong>

          <span>You have completed this lesson.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("wrapper")}>
      <Button fullWidth loading={loading} onClick={handleClick}>
        Complete lesson
      </Button>

      {error && (
        <p className={cx("error")} role="alert">
          Failed to complete lesson. Please try again.
        </p>
      )}
    </div>
  );
}
