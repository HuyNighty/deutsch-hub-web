import classNames from "classnames/bind";
import styles from "./CourseSectionList.module.scss";
import CourseSection from "./CourseSection/CourseSection";

const cx = classNames.bind(styles);

export default function CourseSectionList({ sections }) {
  return (
    <section className={cx("section-list")}>
      <h2 className={cx("heading")}>Curriculum</h2>

      <div className={cx("list")}>
        {sections.map((section) => (
          <CourseSection key={section.id} section={section} />
        ))}
      </div>
    </section>
  );
}
