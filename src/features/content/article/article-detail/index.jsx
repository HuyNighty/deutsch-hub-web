import { useParams } from "react-router-dom";

import classNames from "classnames/bind";

import ResourceState from "@/shared/ui/state/ResourceState";

import { usePublishedArticle } from "../hooks/usePublishedArticle";

import { ArticleCover } from "./ArticleCover";
import { ArticleTopics } from "./ArticleTopics";
import { ArticleSources } from "./ArticleSources";

import styles from "./ArticleDetail.module.scss";

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
              <span className={cx("category-line")} />
              <span>{article.primaryCategory?.name}</span>
            </div>

            <h1 className={cx("title")}>{article.title}</h1>

            {article.summary && (
              <p className={cx("summary")}>{article.summary}</p>
            )}

            <div className={cx("meta")}>
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </time>

              <span className={cx("separator")} aria-hidden="true">
                /
              </span>

              <span>German Learning</span>
            </div>
          </header>

          {article.coverMediaId && (
            <div className={cx("cover-wrapper")}>
              <ArticleCover
                mediaId={article.coverMediaId}
                title={article.title}
              />
            </div>
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

            <div className={cx("article-footer")}>
              <ArticleTopics topics={article.topics} />

              <ArticleSources sources={article.sources} />
            </div>
          </article>
        </main>
      )}
    </ResourceState>
  );
}
