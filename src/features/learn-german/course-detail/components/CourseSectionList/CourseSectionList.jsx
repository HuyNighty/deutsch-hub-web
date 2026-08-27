import classNames from "classnames/bind";
import styles from "./CourseSectionList.module.scss";

import CourseSection from "./CourseSection/CourseSection";

const cx = classNames.bind(styles);

export default function CourseSectionList({ sections = [] }) {
  return (
    <section
      className={cx("section-list")}
      aria-labelledby="course-curriculum-title"
    >
      <div className={cx("heading-group")}>
        <span className={cx("eyebrow")}>COURSE CONTENT</span>

        <div className={cx("heading-row")}>
          <h2 id="course-curriculum-title" className={cx("heading")}>
            Curriculum
          </h2>

          <span className={cx("count")}>{sections.length} sections</span>
        </div>
      </div>

      <div className={cx("list")}>
        {sections.map((section, index) => (
          <CourseSection key={section.id} section={section} index={index} />
        ))}
      </div>
    </section>
  );
}
