import classNames from "classnames/bind";
import styles from "./CourseOverview.module.scss";

const cx = classNames.bind(styles);

export default function CourseOverview({ course }) {
  const sections = course.sections ?? [];

  const lessonCount = sections.reduce(
    (total, section) => total + (section.lessons?.length ?? 0),
    0,
  );

  return (
    <section className={cx("overview")}>
      <div className={cx("heading-group")}>
        <span className={cx("eyebrow")}>ABOUT THIS COURSE</span>

        <h2 className={cx("heading")}>What you'll learn</h2>
      </div>

      <div className={cx("stats")}>
        <div className={cx("stat")}>
          <strong>{course.estimatedHours}</strong>
          <span>Hours</span>
        </div>

        <div className={cx("stat")}>
          <strong>{sections.length}</strong>
          <span>Sections</span>
        </div>

        <div className={cx("stat")}>
          <strong>{lessonCount}</strong>
          <span>Lessons</span>
        </div>

        <div className={cx("stat")}>
          <strong>{course.level}</strong>
          <span>Level</span>
        </div>
      </div>
    </section>
  );
}
