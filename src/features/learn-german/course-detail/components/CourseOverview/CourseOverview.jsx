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
        <span className={cx("eyebrow")}>TỔNG QUAN KHÓA HỌC</span>

        <h2 className={cx("heading")}>Nội dung bạn sẽ học</h2>
      </div>

      <div className={cx("stats")}>
        <div className={cx("stat")}>
          <strong>{course.estimatedHours}</strong>
          <span>Giờ</span>
        </div>

        <div className={cx("stat")}>
          <strong>{sections.length}</strong>
          <span>Phần</span>
        </div>

        <div className={cx("stat")}>
          <strong>{lessonCount}</strong>
          <span>Bài học</span>
        </div>

        <div className={cx("stat")}>
          <strong>{course.level}</strong>
          <span>Trình độ</span>
        </div>
      </div>
    </section>
  );
}
