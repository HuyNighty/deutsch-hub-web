import classNames from "classnames/bind";
import styles from "./LessonHeader.module.scss";

const cx = classNames.bind(styles);

export default function LessonHeader({ lesson }) {
  return (
    <header className={cx("header")}>
      <div className={cx("eyebrow")}>
        <span>BÀI HỌC</span>

        <span className={cx("separator")}>/</span>

        <span>{lesson.level}</span>
      </div>

      <h1 className={cx("title")}>{lesson.title}</h1>

      {lesson.description && (
        <p className={cx("description")}>{lesson.description}</p>
      )}

      <div className={cx("meta")}>
        <span>{lesson.estimatedMinutes} phút</span>

        <span className={cx("separator")}>•</span>

        <span>Bài học {lesson.orderIndex}</span>
      </div>
    </header>
  );
}
