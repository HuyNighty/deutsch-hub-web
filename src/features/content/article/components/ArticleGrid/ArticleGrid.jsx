import { ArticleCard } from "../ArticleCard";

import classNames from "classnames/bind";
import styles from "./ArticleGrid.module.scss";

const cx = classNames.bind(styles);

export default function ArticleGrid({ articles }) {
  return (
    <section className={cx("grid")} aria-label="Articles">
      {articles.map((article) => (
        <ArticleCard key={article.articleId} article={article} />
      ))}
    </section>
  );
}
