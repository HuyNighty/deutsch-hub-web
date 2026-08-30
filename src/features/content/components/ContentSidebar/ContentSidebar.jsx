import classNames from "classnames/bind";

import styles from "./ContentSidebar.module.scss";

const cx = classNames.bind(styles);

const navigation = [
  {
    label: "Tổng quan",
    href: "#overview",
    icon: "⌂",
  },
  {
    label: "Khám phá",
    href: "#explore",
    icon: "◎",
    active: true,
  },
  {
    label: "Ngôn ngữ",
    href: "#language",
    icon: "◎",
  },
  {
    label: "Văn hóa",
    href: "#culture",
    icon: "♜",
  },
  {
    label: "Đời sống",
    href: "#lifestyle",
    icon: "♧",
  },
  {
    label: "Du lịch",
    href: "#travel",
    icon: "△",
  },
  {
    label: "Ẩm thực",
    href: "#food",
    icon: "♜",
  },
  {
    label: "Giáo dục",
    href: "#education",
    icon: "◇",
  },
  {
    label: "Kinh tế",
    href: "#economy",
    icon: "▥",
  },
  {
    label: "Lịch sử",
    href: "#history",
    icon: "◉",
  },
];

function ContentSidebar() {
  return (
    <aside className={cx("sidebar")}>
      <div className={cx("inner")}>
        <a href="/" className={cx("brand")}>
          <span className={cx("brand-mark")}>D</span>

          <span className={cx("brand-name")}>DeutschHub</span>
        </a>

        <nav className={cx("navigation")} aria-label="Content navigation">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={cx("nav-item", {
                active: item.active,
              })}
            >
              <span className={cx("nav-icon")} aria-hidden="true">
                {item.icon}
              </span>

              <span className={cx("nav-label")}>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className={cx("daily")}>
          <span className={cx("daily-eyebrow")}>GÓC NHÌN MỖI NGÀY</span>

          <h2 className={cx("daily-title")}>
            Hiểu nước Đức
            <br />
            sâu hơn mỗi ngày.
          </h2>

          <p className={cx("daily-description")}>
            Mỗi ngày một bài viết chọn lọc giúp bạn hiểu sâu hơn về nước Đức.
          </p>

          <a href="#daily" className={cx("daily-link")}>
            Khám phá ngay
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </aside>
  );
}

export default ContentSidebar;
