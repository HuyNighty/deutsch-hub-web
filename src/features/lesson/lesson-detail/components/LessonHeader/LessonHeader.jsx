import classNames from "classnames/bind";

import styles from "./LessonHeader.module.scss";

const cx = classNames.bind(styles);

export default function LessonHeader({ lesson }) {
  return (
    <header className={cx("header")}>
      <h1 className={cx("title")}>{lesson.title}</h1>

      {lesson.description && (
        <p className={cx("description")}>{lesson.description}</p>
      )}

      <div className={cx("meta")}>
        <span className={cx("item")}>Level: {lesson.level}</span>

        <span className={cx("separator")}>•</span>

        <span className={cx("item")}>{lesson.estimatedMinutes} minutes</span>
      </div>
    </header>
  );
}
