import { Input } from "@/shared/ui/components/input";

import classNames from "classnames/bind";
import styles from "./CourseCatalogHeader.module.scss";

const cx = classNames.bind(styles);

function CourseCatalogHeader() {
  return (
    <section
      className={cx("hero")}
      data-header-hero
      aria-labelledby="course-catalog-title"
    >
      <div className={cx("hero-background")} aria-hidden="true">
        <img src="public/images/learning-german.png" alt="" />
      </div>

      <div className={cx("hero-overlay")} aria-hidden="true" />

      <div className={cx("hero-content")}>
        <span className={cx("eyebrow")}>LEARNING</span>

        <h1 id="course-catalog-title" className={cx("title")}>
          Học tiếng Đức
          <br />
          <span>theo lộ trình bài bản.</span>
        </h1>

        <p className={cx("description")}>
          Lộ trình rõ ràng, nội dung phù hợp và phương pháp học hiện đại giúp
          bạn tiến bộ vững chắc ở mọi cấp độ.
        </p>
      </div>
    </section>
  );
}

export default CourseCatalogHeader;
