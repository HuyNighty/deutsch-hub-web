import classNames from "classnames/bind";

import styles from "./MyCourseHeader.module.scss";

const cx = classNames.bind(styles);

export default function MyCourseHeader({ course }) {
  return (
    <header className={cx("header")}>
      <h1 className={cx("title")}>{course.title}</h1>

      <p className={cx("description")}>{course.description}</p>
    </header>
  );
}
