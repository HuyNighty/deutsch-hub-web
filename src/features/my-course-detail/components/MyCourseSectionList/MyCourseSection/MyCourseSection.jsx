import classNames from "classnames/bind";
import styles from "./MyCourseSection.module.scss";

import { MyLessonList } from "./MyLessonList";

const cx = classNames.bind(styles);

export default function MyCourseSection({ courseId, section }) {
  return (
    <article className={cx("section")}>
      <header className={cx("header")}>
        <h3 className={cx("title")}>{section.title}</h3>

        {section.description && (
          <p className={cx("description")}>{section.description}</p>
        )}
      </header>

      <MyLessonList courseId={courseId} lessons={section.lessons} />
    </article>
  );
}
