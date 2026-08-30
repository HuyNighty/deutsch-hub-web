import { AppLink } from "@/shared/ui/components/app-link";
import useMedia from "@/features/media/hooks/useMedia";

import classNames from "classnames/bind";
import styles from "./FeaturedArticle.module.scss";

const cx = classNames.bind(styles);

function FeaturedArticle({ article }) {
  const { media, isPending } = useMedia(article?.coverMediaId);

  if (!article) {
    return null;
  }

  const articleUrl = `/explore-germany/${article.slug}`;

  return (
    <section className={cx("section")} aria-labelledby="featured-article-title">
      <div className={cx("heading")}>
        <span className={cx("eyebrow")}>BÀI VIẾT NỔI BẬT</span>

        <span className={cx("rule")} aria-hidden="true" />
      </div>

      <article className={cx("article")}>
        <AppLink to={articleUrl} variant="default" className={cx("image-link")}>
          {isPending || !media ? (
            <div className={cx("image-placeholder")}>
              <span>DeutschHub</span>
            </div>
          ) : (
            <img
              src={media.objectUrl}
              alt={article.title}
              className={cx("image")}
            />
          )}
        </AppLink>

        <div className={cx("content")}>
          {article.primaryCategory?.name && (
            <span className={cx("category")}>
              {article.primaryCategory.name}
            </span>
          )}

          <h2 id="featured-article-title" className={cx("title")}>
            <AppLink to={articleUrl} variant="default">
              {article.title}
            </AppLink>
          </h2>

          {article.summary && (
            <p className={cx("summary")}>{article.summary}</p>
          )}

          {article.topics?.length > 0 && (
            <div className={cx("topics")}>
              {article.topics.slice(0, 3).map((topic) => (
                <span key={topic.id} className={cx("topic")}>
                  {topic.name}
                </span>
              ))}
            </div>
          )}

          <div className={cx("footer")}>
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
            </time>

            <AppLink
              to={articleUrl}
              variant="default"
              className={cx("read-more")}
            >
              Đọc câu chuyện
              <span aria-hidden="true">→</span>
            </AppLink>
          </div>
        </div>
      </article>
    </section>
  );
}

export default FeaturedArticle;
