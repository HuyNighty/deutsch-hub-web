import classNames from "classnames/bind";

import styles from "./MyCourseProgress.module.scss";

const cx = classNames.bind(styles);

const statusMap = {
  ENROLLED: "Đã đăng ký",
  IN_PROGRESS: "Đang học",
  COMPLETED: "Đã hoàn thành khóa học",
};

export default function MyCourseProgress({ course }) {
  const status = statusMap[course.enrollmentStatus] ?? course.enrollmentStatus;

  return (
    <section className={cx("progress")}>
      <h2 className={cx("heading")}>Tiến độ khóa học</h2>

      <div className={cx("stats")}>
        <div className={cx("stat")}>
          <span className={cx("label")}>Tiến độ</span>
          <div className={cx("progress-bar")}>
            <div
              className={cx("progress-fill")}
              style={{
                width: `${course.completionPercentage}%`,
              }}
            />
          </div>
          {course.completionPercentage}%
        </div>

        <div className={cx("stat")}>
          <span className={cx("label")}>Bài học</span>
          <strong className={cx("value")}>
            {course.completedLessons}/{course.totalLessons}
          </strong>
        </div>

        <div className={cx("stat")}>
          <span className={cx("label")}>Thời gian học đã ghi nhận</span>
          <strong className={cx("value")}>
            {course.totalStudyMinutes} phút
          </strong>
        </div>

        <div className={cx("stat")}>
          <span className={cx("label")}>Trạng thái</span>
          <strong className={cx("value")}>{status}</strong>
        </div>
      </div>
    </section>
  );
}
