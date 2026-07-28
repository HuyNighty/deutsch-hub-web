import classNames from "classnames/bind";
import styles from "./CourseHeader.module.scss";

const cx = classNames.bind(styles);

export default function CourseHeader({ course }) {
  return (
    <header className={cx("header")}>
      <h1 className={cx("title")}>{course.title}</h1>

      <div className={cx("meta")}>
        <span className={cx("item")}>Level: {course.level}</span>

        <span className={cx("item")}>
          {course.estimatedHours} hour
          {course.estimatedHours > 1 ? "s" : ""}
        </span>

        <span className={cx("item")}>
          {course.price} {course.currency}
        </span>
      </div>
    </header>
  );
}
