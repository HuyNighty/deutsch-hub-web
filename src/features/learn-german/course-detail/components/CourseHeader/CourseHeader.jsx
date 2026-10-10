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
        Quay lại tất cả khóa học
      </AppLink>

      <div className={cx("content")}>
        <span className={cx("level")}>{course.level}</span>

        <h1 className={cx("title")}>{course.title}</h1>

        <p className={cx("description")}>{course.description}</p>

        <div className={cx("meta")}>
          <span>Trình độ {course.level}</span>

          <span>{course.estimatedHours} giờ</span>

          <span>
            {sectionCount} phần
          </span>
        </div>
      </div>
    </header>
  );
}
