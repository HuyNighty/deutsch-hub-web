import classNames from "classnames/bind";
import styles from "./CourseCatalogHeader.module.scss";
import { Input } from "@/shared/ui/component/input";

const cx = classNames.bind(styles);

function CourseCatalogHeader() {
  return (
    <section className={cx("header")}>
      <div className={cx("content")}>
        <h1 className={cx("title")}>Course Catalog</h1>

        <p className={cx("description")}>
          Explore German courses for every level.
        </p>
      </div>

      <Input id="search-course" type="text" placeholder="Search courses..." />
    </section>
  );
}

export default CourseCatalogHeader;
