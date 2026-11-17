import classNames from "classnames/bind";

import styles from "./ContentSidebar.module.scss";

const cx = classNames.bind(styles);

function ContentSidebar({ sections = [], hasFeatured = false }) {
  const navigation = [
    { label: "Tổng quan", href: "#overview", icon: "⌂" },
    ...(sections.length ? [{ label: "Khám phá", href: "#explore", icon: "◎" }] : []),
    ...sections.map((section) => ({
      label: section.name,
      href: `#category-${section.id}`,
      icon: "◇",
    })),
  ];

  return (
    <aside className={cx("sidebar")}>
      <div className={cx("inner")}>
        <a href="/" className={cx("brand")}>
          <span className={cx("brand-mark")}>D</span>
          <span className={cx("brand-name")}>DeutschHub</span>
        </a>

        <nav className={cx("navigation")} aria-label="Điều hướng bài viết">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className={cx("nav-item")}>
              <span className={cx("nav-icon")} aria-hidden="true">{item.icon}</span>
              <span className={cx("nav-label")}>{item.label}</span>
            </a>
          ))}
        </nav>

        {hasFeatured && (
          <div className={cx("daily")}>
            <span className={cx("daily-eyebrow")}>BÀI VIẾT NỔI BẬT</span>
            <h2 className={cx("daily-title")}>Hiểu nước Đức sâu hơn.</h2>
            <p className={cx("daily-description")}>
              Khám phá bài viết đã được xuất bản trên DeutschHub.
            </p>
            <a href="#featured" className={cx("daily-link")}>
              Đọc bài viết
              <span aria-hidden="true">→</span>
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}

export default ContentSidebar;
