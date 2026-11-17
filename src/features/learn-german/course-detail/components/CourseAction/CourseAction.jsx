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
          Tiếp tục học
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
          Xem lại khóa học
        </Button>
      );
      break;

    case "DROPPED":
    case "EXPIRED":
      // Backend preserves enrollment history and rejects a second POST (50004).
      // Never offer an action the current API cannot complete.
      button = <Button size="lg" fullWidth disabled>Không thể đăng ký lại</Button>;
      break;

    default:
      button = (
        <Button size="lg" fullWidth onClick={handleEnroll} loading={loading} disabled={canCheckEnrollment}>
          {phase === "checking" ? "Đang kiểm tra trạng thái đăng ký…" : phase === "confirmed" ? "Đã xác nhận đăng ký. Đang mở khóa học…" : loading ? "Đang đăng ký khóa học…" : "Đăng ký khóa học"}
        </Button>
      );
  }

  return (
    <aside lang="vi" className={cx("action")}>
      <div className={cx("header")}>
        <span className={cx("label")}>TRUY CẬP KHÓA HỌC</span>

        <span className={cx("status")}>
          {phase === "unavailable"
            ? "Không khả dụng"
            : phase === "uncertain"
              ? "Chưa xác nhận"
              : enrollmentStatus === "COMPLETED"
                ? "Đã hoàn thành khóa học"
                : enrollmentStatus === "IN_PROGRESS"
                  ? "Đang học"
                  : enrollmentStatus === "ENROLLED"
                    ? "Đã đăng ký"
                    : enrollmentStatus === "DROPPED"
                      ? "Đã ngừng học"
                      : enrollmentStatus === "EXPIRED"
                        ? "Đã hết hạn"
                        : "Khả dụng"}
        </span>
      </div>

      <div className={cx("divider")} />

      <div className={cx("button")}>{button}</div>

      {(enrollmentStatus === "DROPPED" || enrollmentStatus === "EXPIRED") && !canCheckEnrollment && (
        <p>Khóa học đã có lịch sử đăng ký. Hiện không thể đăng ký lại qua trang này.</p>
      )}
      {error && <p role="alert">{error.message}</p>}
      {canCheckEnrollment && (
        <Button variant="outline" fullWidth onClick={checkEnrollment}>
          Kiểm tra trạng thái đăng ký
        </Button>
      )}
    </aside>
  );
}
