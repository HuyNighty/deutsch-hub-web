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

  const { loading, error, handleComplete, checkCompletion, phase, uncertain } = useCompleteLesson(courseId, id, onCompleted);

  if (phase === "confirmed" || (phase === "idle" && completed)) {
    return (
      <div className={cx("completed")}>
        <span className={cx("icon")} aria-hidden="true">
          ✓
        </span>

        <div className={cx("content")}>
          <strong>Đã hoàn thành bài học</strong>

          <span>Bạn đã hoàn thành bài học này.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("wrapper")}>
      <Button fullWidth loading={loading} disabled={uncertain} onClick={() => handleComplete(estimatedMinutes)}>
        {phase === "checking" ? "Đang kiểm tra trạng thái hoàn thành…" : loading ? "Đang ghi nhận hoàn thành…" : "Hoàn thành bài học"}
      </Button>

      {error && (
        <p className={cx("error")} role="alert">
          {error.message}
        </p>
      )}
      {uncertain && (
        <Button fullWidth variant="outline" onClick={checkCompletion}>
          Kiểm tra trạng thái hoàn thành
        </Button>
      )}
    </div>
  );
}
