import classNames from "classnames/bind";
import styles from "./LessonHeader.module.scss";

const cx = classNames.bind(styles);

export default function LessonHeader({ lesson }) {
  return (
    <header className={cx("header")}>
      <div className={cx("eyebrow")}>
        <span>LEARNING</span>

        <span className={cx("separator")}>/</span>

        <span>{lesson.level}</span>
      </div>

      <h1 className={cx("title")}>{lesson.title}</h1>

      {lesson.description && (
        <p className={cx("description")}>{lesson.description}</p>
      )}

      <div className={cx("meta")}>
        <span>{lesson.estimatedMinutes} min</span>

        <span className={cx("separator")}>•</span>

        <span>Lesson {lesson.orderIndex}</span>
      </div>
    </header>
  );
}
