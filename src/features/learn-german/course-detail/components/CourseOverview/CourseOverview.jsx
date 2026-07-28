import classNames from "classnames/bind";
import styles from "./CourseOverview.module.scss";

const cx = classNames.bind(styles);

export default function CourseOverview({ course }) {
  return (
    <section className={cx("overview")}>
      <h2 className={cx("heading")}>Overview</h2>

      <p className={cx("description")}>{course.description}</p>
    </section>
  );
}
