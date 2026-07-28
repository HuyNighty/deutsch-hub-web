import classNames from "classnames/bind";
import { Link } from "react-router-dom";

import styles from "./CourseCard.module.scss";

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
        <Link className={cx("link")} to={`/learn-german/courses/${course.id}`}>
          View Course →
        </Link>
      </footer>
    </article>
  );
}

export default CourseCard;
