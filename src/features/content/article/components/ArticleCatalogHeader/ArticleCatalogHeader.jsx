import classNames from "classnames/bind";

import styles from "./ArticleCatalogHeader.module.scss";

const cx = classNames.bind(styles);

export default function ArticleCatalogHeader() {
  return (
    <header className={cx("header")}>
      <div className={cx("content")}>
        <div className={cx("eyebrow")}>
          <span className={cx("eyebrow-line")} />
          <span>CONTENT</span>
        </div>

        <h1 className={cx("title")}>
          Explore Germany.
          <br />
          <span>Learn beyond the language.</span>
        </h1>

        <p className={cx("description")}>
          Discover articles about German language, culture, society, and
          everyday life in Germany. Search by topic or category to find what you
          are looking for.
        </p>

        <div className={cx("topics")}>
          <span>LANGUAGE</span>
          <span>CULTURE</span>
          <span>SOCIETY</span>
          <span>EVERYDAY LIFE</span>
        </div>
      </div>
    </header>
  );
}
