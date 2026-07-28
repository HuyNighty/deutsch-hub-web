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
          {completedLessons} / {totalLessons} lessons
        </span>

        <span>{completionPercentage}%</span>
      </div>

      <progress className={cx("bar")} value={completionPercentage} max={100} />
    </section>
  );
}
