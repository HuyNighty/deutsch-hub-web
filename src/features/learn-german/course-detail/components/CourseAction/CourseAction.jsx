import classNames from "classnames/bind";
import styles from "./CourseAction.module.scss";

import { useNavigate } from "react-router-dom";

import { useEnrollAction } from "../../hooks/useEnrollAction";
import { Button } from "@/shared/ui/components/button";

const cx = classNames.bind(styles);

export default function CourseAction({ courseId, enrollmentStatus }) {
  const navigate = useNavigate();

  const { handleEnroll, checkEnrollment, loading, error, phase, canCheckEnrollment } = useEnrollAction(courseId);

  let button;

  switch (loading || canCheckEnrollment ? null : enrollmentStatus) {
    case "ENROLLED":
    case "IN_PROGRESS":
      button = (
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate(`/my-learning/courses/${courseId}`)}
        >
          Continue learning
        </Button>
      );
      break;

    case "COMPLETED":
      button = (
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate(`/my-learning/courses/${courseId}`)}
        >
          Review course
        </Button>
      );
      break;

    default:
      button = (
        <Button size="lg" fullWidth onClick={handleEnroll} loading={loading} disabled={canCheckEnrollment}>
          {phase === "checking" ? "Checking enrollment…" : phase === "confirmed" ? "Opening course…" : loading ? "Enrolling…" : "Enroll course"}
        </Button>
      );
  }

  return (
    <aside className={cx("action")}>
      <div className={cx("header")}>
        <span className={cx("label")}>COURSE ACCESS</span>

        <span className={cx("status")}>
          {phase === "unavailable"
            ? "Unavailable"
            : phase === "uncertain"
              ? "Unconfirmed"
              : enrollmentStatus === "COMPLETED"
                ? "Completed"
                : enrollmentStatus === "IN_PROGRESS"
                  ? "In progress"
                  : enrollmentStatus === "ENROLLED"
                    ? "Enrolled"
                    : "Available"}
        </span>
      </div>

      <div className={cx("divider")} />

      <div className={cx("button")}>{button}</div>

      {error && <p role="alert">{error.message}</p>}
      {canCheckEnrollment && (
        <Button variant="outline" fullWidth onClick={checkEnrollment}>
          Check enrollment status
        </Button>
      )}
    </aside>
  );
}
