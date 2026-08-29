import { AppLink } from "@/shared/ui/components/app-link";
import useMedia from "@/features/media/hooks/useMedia";

import classNames from "classnames/bind";
import styles from "./ContentPreviewCard.module.scss";

const cx = classNames.bind(styles);

export default function ContentPreviewCard({ article }) {
  const { media, isPending } = useMedia(article.coverMediaId);

  const articleUrl = `/explore-germany/${article.slug}`;

  return (
    <article className={cx("card")}>
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

        <span className={cx("image-overlay")} aria-hidden="true" />
      </AppLink>

      <div className={cx("card-body")}>
        <div className={cx("card-meta")}>
          {article.primaryCategory?.name && (
            <span className={cx("category")}>
              {article.primaryCategory.name}
            </span>
          )}

          {article.publishedAt && (
            <time dateTime={article.publishedAt} className={cx("date")}>
              {new Date(article.publishedAt).toLocaleDateString("en-GB")}
            </time>
          )}
        </div>

        <h3 className={cx("card-title")}>
          <AppLink to={articleUrl} variant="default">
            {article.title}
          </AppLink>
        </h3>

        {article.summary && (
          <p className={cx("card-description")}>{article.summary}</p>
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

        <AppLink to={articleUrl} variant="default" className={cx("read-more")}>
          <span>Read article</span>

          <span className={cx("arrow")} aria-hidden="true">
            →
          </span>
        </AppLink>
      </div>
    </article>
  );
}
