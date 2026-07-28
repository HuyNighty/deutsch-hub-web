import classNames from "classnames/bind";
import styles from "./MyCourseSectionList.module.scss";

import MyCourseSection from "./MyCourseSection/MyCourseSection";

const cx = classNames.bind(styles);

export default function MyCourseSectionList({ courseId, sections }) {
  return (
    <section className={cx("section-list")}>
      <h2 className={cx("heading")}>Course Content</h2>

      <div className={cx("list")}>
        {sections.map((section) => (
          <MyCourseSection
            key={section.id}
            courseId={courseId}
            section={section}
          />
        ))}
      </div>
    </section>
  );
}
