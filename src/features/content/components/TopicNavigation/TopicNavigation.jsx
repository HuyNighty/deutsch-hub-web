import classNames from "classnames/bind";
import styles from "./TopicNavigation.module.scss";
import { FlowingMenu } from "../FlowingMenu";

const cx = classNames.bind(styles);

function TopicNavigation({ sections = [] }) {
  if (!sections.length) return null;

  return (
    <nav className={cx("navigation")} aria-label="Khám phá theo danh mục có bài viết">
      <div className={cx("header")}>
        <div>
          <span className={cx("eyebrow")}>MỤC LỤC</span>
          <h2 className={cx("title")}>Khám phá nước Đức</h2>
        </div>
        <p className={cx("intro")}>
          Chọn một danh mục để đến những bài viết đang được hiển thị.
        </p>
      </div>

      <div className={cx("topics")}>
        {sections.map((section) => (
          <FlowingMenu
            key={section.id}
            number={section.number}
            title={section.name}
            description={`${section.articles.length} bài viết đang hiển thị`}
            link={`#category-${section.id}`}
          />
        ))}
      </div>
    </nav>
  );
}

export default TopicNavigation;
