import classNames from "classnames/bind";
import styles from "./CourseSection.module.scss";

import { LessonList } from "./LessonList";

const cx = classNames.bind(styles);

export default function CourseSection({ section, index }) {
  const lessons = section.lessons ?? [];

  const totalMinutes = lessons.reduce(
    (total, lesson) => total + (lesson.estimatedMinutes ?? 0),
    0,
  );

  return (
    <article className={cx("section")}>
      <header className={cx("header")}>
        <div className={cx("number")}>{String(index + 1).padStart(2, "0")}</div>

        <div className={cx("content")}>
          <div className={cx("title-row")}>
            <h3 className={cx("title")}>{section.title}</h3>

            <span className={cx("meta")}>
              {lessons.length} lessons · {totalMinutes} min
            </span>
          </div>

          {section.description && (
            <p className={cx("description")}>{section.description}</p>
          )}
        </div>
      </header>

      <LessonList lessons={lessons} />
    </article>
  );
}
