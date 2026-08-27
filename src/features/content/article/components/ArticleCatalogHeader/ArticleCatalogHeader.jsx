import classNames from "classnames/bind";

import styles from "./ArticleCatalogHeader.module.scss";

const cx = classNames.bind(styles);

export default function ArticleCatalogHeader() {
  return (
    <header className={cx("header")}>
      <div className={cx("content")}>
        <span className={cx("eyebrow")}>CONTENT</span>

        <h1 className={cx("title")}>
          Explore Germany.
          <br />
          Learn beyond the language.
        </h1>

        <p className={cx("description")}>
          Discover articles about German language, culture, society, and
          everyday life in Germany.
        </p>
      </div>
    </header>
  );
}
