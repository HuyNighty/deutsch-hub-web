import classNames from "classnames/bind";
import styles from "./LessonItem.module.scss";

const cx = classNames.bind(styles);

export default function LessonItem({ lesson }) {
  return (
    <li className={cx("item")}>
      <div className={cx("main")}>
        <span className={cx("icon")} aria-hidden="true">
          →
        </span>

        <div className={cx("content")}>
          <h4 className={cx("title")}>{lesson.title}</h4>

          {lesson.description && (
            <p className={cx("description")}>{lesson.description}</p>
          )}
        </div>
      </div>

      <div className={cx("meta")}>
        {lesson.freePreview && <span className={cx("preview")}>Preview</span>}

        <span className={cx("duration")}>{lesson.estimatedMinutes} min</span>
      </div>
    </li>
  );
}
