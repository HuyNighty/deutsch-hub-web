import classNames from "classnames/bind";
import styles from "./LessonItem.module.scss";

const cx = classNames.bind(styles);

export default function LessonItem({ lesson }) {
  return (
    <li className={cx("item")}>
      <h4 className={cx("title")}>{lesson.title}</h4>

      {lesson.description && (
        <p className={cx("description")}>{lesson.description}</p>
      )}

      <span className={cx("duration")}>{lesson.estimatedMinutes} minutes</span>
    </li>
  );
}
