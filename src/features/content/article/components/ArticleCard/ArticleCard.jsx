import useMedia from "@/features/media/hooks/useMedia";
import { AppLink } from "@/shared/ui/components/app-link";

import classNames from "classnames/bind";
import styles from "./ArticleCard.module.scss";

const cx = classNames.bind(styles);

export default function ArticleCard({ article }) {
  const { media, isPending, isError } = useMedia(article.coverMediaId);

  return (
    <article className={cx("card")}>
      <div className={cx("cover")}>
        {isPending && (
          <div className={cx("media-placeholder")}>Loading image...</div>
        )}

        {isError && (
          <div className={cx("media-placeholder")}>Image unavailable</div>
        )}

        {media && (
          <img
            className={cx("image")}
            src={media.objectUrl}
            alt=""
            loading="lazy"
          />
        )}
      </div>

      <div className={cx("body")}>
        <div className={cx("meta")}>
          <span>Germany</span>

          <span className={cx("separator")}>•</span>

          <span>{formatPublishedDate(article.publishedAt)}</span>
        </div>

        <h2 className={cx("title")}>{article.title}</h2>

        {article.summary && <p className={cx("summary")}>{article.summary}</p>}

        <div className={cx("footer")}>
          <AppLink
            to={`/explore-germany/${article.slug}`}
            className={cx("link")}
          >
            Read article
            <span aria-hidden="true">→</span>
          </AppLink>
        </div>
      </div>
    </article>
  );
}

function formatPublishedDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
