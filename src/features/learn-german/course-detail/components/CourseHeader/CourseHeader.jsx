import { AppLink } from "@/shared/ui/components/app-link";

import classNames from "classnames/bind";
import styles from "./CourseHeader.module.scss";

const cx = classNames.bind(styles);

export default function CourseHeader({ course }) {
  const sectionCount = course.sections?.length ?? 0;

  return (
    <header className={cx("header")}>
      <AppLink
        to="/learn-german"
        variant="default"
        size="sm"
        className={cx("back")}
      >
        <span aria-hidden="true">←</span>
        All courses
      </AppLink>

      <div className={cx("content")}>
        <span className={cx("level")}>{course.level}</span>

        <h1 className={cx("title")}>{course.title}</h1>

        <p className={cx("description")}>{course.description}</p>

        <div className={cx("meta")}>
          <span>{course.level} Level</span>

          <span>{course.estimatedHours} hours</span>

          <span>
            {sectionCount} {sectionCount === 1 ? "section" : "sections"}
          </span>
        </div>
      </div>
    </header>
  );
}
