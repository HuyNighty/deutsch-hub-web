import { AppLink } from "@/shared/ui/components/app-link";

import styles from "./CourseCard.module.scss";

import classNames from "classnames/bind";
const cx = classNames.bind(styles);

function CourseCard({ course }) {
  return (
    <article className={cx("card")}>
      <header className={cx("header")}>
        <span className={cx("level")}>{course.level}</span>
      </header>

      <div className={cx("body")}>
        <h2 className={cx("title")}>{course.title}</h2>

        <p className={cx("description")}>{course.description}</p>
      </div>

      <footer className={cx("footer")}>
        <AppLink
          to={`/learn-german/courses/${course.id}`}
          className={cx("link")}
        >
          View course
          <span aria-hidden="true">→</span>
        </AppLink>
      </footer>
    </article>
  );
}

export default CourseCard;
