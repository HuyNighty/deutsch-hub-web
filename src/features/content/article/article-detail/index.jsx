import { useParams } from "react-router-dom";

import ResourceState from "@/shared/ui/state/ResourceState";
import { usePublishedArticle } from "../hooks/usePublishedArticle";

import classNames from "classnames/bind";
import styles from "./ArticleDetail.module.scss";
import { ArticleCover } from "./ArticleCover";
import { ArticleTopics } from "./ArticleTopics";
import { ArticleSources } from "./ArticleSources";

const cx = classNames.bind(styles);

export default function ArticleDetail() {
  const { slug } = useParams();

  const { article, loading, error, refetch } = usePublishedArticle(slug);

  return (
    <ResourceState
      loading={loading}
      error={error}
      errorProps={{
        onRetry: refetch,
      }}
    >
      {article && (
        <main className={cx("page")}>
          <header className={cx("header")}>
            <div className={cx("category")}>
              {article.primaryCategory?.name}
            </div>

            <h1 className={cx("title")}>{article.title}</h1>

            {article.summary && (
              <p className={cx("summary")}>{article.summary}</p>
            )}

            <div className={cx("meta")}>
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString("en-GB")}
              </time>

              <span className={cx("separator")}>•</span>

              <span>German Learning</span>
            </div>
          </header>

          {article.coverMediaId && (
            <ArticleCover
              mediaId={article.coverMediaId}
              title={article.title}
            />
          )}

          <article className={cx("article")}>
            <div className={cx("body")}>
              {article.body
                ?.split(/\n\s*\n/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>

            <ArticleTopics topics={article.topics} />

            <ArticleSources sources={article.sources} />
          </article>
        </main>
      )}
    </ResourceState>
  );
}
