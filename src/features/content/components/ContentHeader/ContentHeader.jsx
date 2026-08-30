import classNames from "classnames/bind";

import styles from "./ContentHeader.module.scss";

const cx = classNames.bind(styles);

const navigation = [
  {
    label: "Learning",
    href: "/learn-german",
  },
  {
    label: "Content",
    href: "/content",
    active: true,
  },
  {
    label: "Study",
    href: "/study",
  },
  {
    label: "Communication",
    href: "/communication",
  },
];

function ContentHeader() {
  return (
    <header className={cx("header")}>
      <nav className={cx("navigation")} aria-label="Primary navigation">
        {navigation.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={cx("nav-link", {
              active: item.active,
            })}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className={cx("actions")}>
        <a href="/login" className={cx("login")}>
          Login
        </a>

        <a href="/register" className={cx("register")}>
          Get started
        </a>
      </div>
    </header>
  );
}

export default ContentHeader;
