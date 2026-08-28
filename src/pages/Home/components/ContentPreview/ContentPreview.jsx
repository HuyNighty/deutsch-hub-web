import { AppLink } from "@/shared/ui/components/app-link";

import classNames from "classnames/bind";
import styles from "./ContentPreview.module.scss";

import { usePublishedArticles } from "@/features/content/article/hooks/usePublishedArticles";

const cx = classNames.bind(styles);

export default function ContentPreview() {
  const { articles, loading, error } = usePublishedArticles({
    page: 0,
    size: 3,
  });

  return (
    <section className={cx("section")} aria-labelledby="content-preview-title">
      <div className={cx("header")}>
        <div className={cx("header-copy")}>
          <span className={cx("eyebrow")}>CONTENT</span>

          <h2 id="content-preview-title" className={cx("title")}>
            Discover Germany.
            <br />
            <span>One story at a time.</span>
          </h2>
        </div>

        <p className={cx("description")}>
          DeutschHub is more than a place to learn German. Explore the country,
          its culture, people, history, and everyday life.
        </p>
      </div>

      {loading && (
        <div className={cx("state")}>
          <span>Loading content...</span>
        </div>
      )}

      {error && !loading && (
        <div className={cx("state", "state-error")}>
          <span>Unable to load content.</span>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className={cx("state")}>
          <span>No published content available.</span>
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className={cx("grid")}>
          {articles.slice(0, 3).map((article) => (
            <article key={article.articleId} className={cx("card")}>
              <AppLink
                to={`/explore-germany/${article.slug}`}
                variant="default"
                className={cx("image-link")}
              >
                <div className={cx("image-placeholder")}>
                  <span>DeutschHub</span>
                </div>
              </AppLink>

              <div className={cx("card-body")}>
                <span className={cx("category")}>
                  {article.primaryCategoryId}
                </span>

                <h3 className={cx("card-title")}>
                  <AppLink
                    to={`/explore-germany/${article.slug}`}
                    variant="default"
                  >
                    {article.title}
                  </AppLink>
                </h3>

                <p className={cx("card-description")}>{article.summary}</p>

                <AppLink
                  to={`/explore-germany/${article.slug}`}
                  variant="default"
                  className={cx("read-more")}
                >
                  Read more
                  <span aria-hidden="true">→</span>
                </AppLink>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className={cx("footer")}>
        <AppLink
          to="/explore-germany"
          variant="default"
          className={cx("view-all")}
        >
          Explore all content
          <span aria-hidden="true">→</span>
        </AppLink>
      </div>
    </section>
  );
}
