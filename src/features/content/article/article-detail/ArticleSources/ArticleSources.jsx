import classNames from "classnames/bind";
import styles from "./ArticleSources.module.scss";

const cx = classNames.bind(styles);

export default function ArticleSources({ sources = [] }) {
  if (!sources.length) {
    return null;
  }

  return (
    <footer className={cx("sources")}>
      <h2 className={cx("heading")}>Sources</h2>

      <ul className={cx("list")}>
        {sources.map((source, index) => (
          <li key={`${source.title}-${index}`} className={cx("item")}>
            <a
              className={cx("link")}
              href={source.title}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.url}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
