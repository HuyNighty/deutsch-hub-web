import classNames from "classnames/bind";

import styles from "./MyCourseProgressBar.module.scss";

const cx = classNames.bind(styles);

export default function MyCourseProgressBar({
  completedLessons,
  totalLessons,
  completionPercentage,
}) {
  return (
    <section className={cx("progress")}>
      <div className={cx("header")}>
        <span>
          {completedLessons} / {totalLessons} bài học
        </span>

        <span>{completionPercentage}%</span>
      </div>

      <progress aria-label="Tiến độ khóa học" className={cx("bar")} value={completionPercentage} max={100} />
    </section>
  );
}
