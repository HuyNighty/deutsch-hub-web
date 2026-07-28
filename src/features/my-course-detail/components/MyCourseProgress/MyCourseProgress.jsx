import classNames from "classnames/bind";

import styles from "./MyCourseProgress.module.scss";

const cx = classNames.bind(styles);

const statusMap = {
  ENROLLED: "Enrolled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export default function MyCourseProgress({ course }) {
  const status = statusMap[course.enrollmentStatus] ?? course.enrollmentStatus;

  return (
    <section className={cx("progress")}>
      <h2 className={cx("heading")}>Learning Progress</h2>

      <div className={cx("stats")}>
        <div className={cx("stat")}>
          <span className={cx("label")}>Progress</span>
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
          <span className={cx("label")}>Lessons</span>
          <strong className={cx("value")}>
            {course.completedLessons}/{course.totalLessons}
          </strong>
        </div>

        <div className={cx("stat")}>
          <span className={cx("label")}>Study Time</span>
          <strong className={cx("value")}>
            {course.totalStudyMinutes} min
          </strong>
        </div>

        <div className={cx("stat")}>
          <span className={cx("label")}>Status</span>
          <strong className={cx("value")}>{status}</strong>
        </div>
      </div>
    </section>
  );
}
