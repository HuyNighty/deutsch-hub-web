import classNames from "classnames/bind";
import styles from "./CourseSection.module.scss";

import { LessonList } from "./LessonList";

const cx = classNames.bind(styles);

export default function CourseSection({ section }) {
  return (
    <article className={cx("section")}>
      <header className={cx("header")}>
        <h3 className={cx("title")}>{section.title}</h3>

        {section.description && (
          <p className={cx("description")}>{section.description}</p>
        )}
      </header>

      <LessonList lessons={section.lessons} />
    </article>
  );
}
