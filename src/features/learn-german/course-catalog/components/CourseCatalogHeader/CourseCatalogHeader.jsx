import { Input } from "@/shared/ui/components/input";

import classNames from "classnames/bind";
import styles from "./CourseCatalogHeader.module.scss";
import { LearningPathPreview } from "@/features/learn-german/components/LearningPathPreview";

const cx = classNames.bind(styles);

function CourseCatalogHeader() {
  return (
    <section className={cx("header")} aria-labelledby="course-catalog-title">
      <div className={cx("content")}>
        <span className={cx("eyebrow")}>LEARNING</span>

        <h1 id="course-catalog-title" className={cx("title")}>
          Learn German,
          <br />
          step by step.
        </h1>

        <p className={cx("description")}>
          Build your German skills through structured courses designed for every
          level.
        </p>
      </div>

      <div className={cx("aside")}>
        <div className={cx("search")}>
          <Input
            id="search-course"
            type="search"
            placeholder="Search courses..."
            aria-label="Search courses"
          />
        </div>

        <LearningPathPreview />
      </div>
    </section>
  );
}

export default CourseCatalogHeader;
