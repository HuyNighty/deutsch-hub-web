import classNames from "classnames/bind";

import styles from "./CourseGrid.module.scss";
import { CourseCard } from "../CourseCard";

const cx = classNames.bind(styles);

function CourseGrid({ courses }) {
  return (
    <section className={cx("grid")} aria-label="Danh sách khóa học">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </section>
  );
}

export default CourseGrid;
