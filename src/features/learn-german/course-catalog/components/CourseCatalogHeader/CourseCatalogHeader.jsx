import classNames from "classnames/bind";
import styles from "./CourseCatalogHeader.module.scss";
const cx = classNames.bind(styles);

const options = [
  { value: "all", label: "Tất cả" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
];

export default function CourseCatalogHeader({ level, onLevelChange }) {
  return (
    <section className={cx("hero")} data-header-hero aria-labelledby="course-catalog-title">
      <div className={cx("scenery")} aria-hidden="true" />
      <div className={cx("veil")} aria-hidden="true" />
      <div className={cx("copy")}>
        <p className={cx("eyebrow")}>HỌC TIẾNG ĐỨC CÙNG DEUTSCHHUB</p>
        <h1 id="course-catalog-title">Khóa học tiếng Đức<br />từ cơ bản <em>đến nâng cao</em></h1>
        <p className={cx("description")}>Lộ trình học theo chuẩn CEFR, giúp bạn giao tiếp tự tin, học tập và làm việc trong môi trường tiếng Đức.</p>
        <div className={cx("levels")} role="group" aria-label="Chọn trình độ khóa học">
          {options.map((option) => <button key={option.value} type="button"
            aria-pressed={level === option.value}
            className={cx("level", { selected: level === option.value })}
            onClick={() => onLevelChange(option.value)}>{option.label}</button>)}
        </div>
      </div>
    </section>
  );
}
