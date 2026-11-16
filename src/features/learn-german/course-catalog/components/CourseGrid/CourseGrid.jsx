import classNames from "classnames/bind";
import styles from "./CourseGrid.module.scss";
import { CourseCard } from "../CourseCard";
const cx = classNames.bind(styles);

export default function CourseGrid({ courses }) {
  return (
    <div className={cx("grid")}>
      {courses.map((course) => <CourseCard key={course.id} course={course} />)}
    </div>
  );
}
