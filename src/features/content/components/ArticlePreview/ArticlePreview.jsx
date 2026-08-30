import { AppLink } from "@/shared/ui/components/app-link";
import useMedia from "@/features/media/hooks/useMedia";

import classNames from "classnames/bind";
import styles from "./ArticlePreview.module.scss";

const cx = classNames.bind(styles);

function ArticlePreview({ article }) {
  const hasMedia = Boolean(article?.coverMediaId);

  const { media, isPending } = useMedia(hasMedia ? article.coverMediaId : null);

  if (!article) {
    return null;
  }

  const articleUrl = `/explore-germany/${article.slug}`;

  const imageSource = media?.objectUrl || article.image;

  return (
    <AppLink to={articleUrl} variant="default" className={cx("article")}>
      <div className={cx("image-wrapper")}>
        {isPending && hasMedia ? (
          <div className={cx("image-placeholder")}>
            <span>DeutschHub</span>
          </div>
        ) : imageSource ? (
          <img src={imageSource} alt={article.title} className={cx("image")} />
        ) : (
          <div className={cx("image-placeholder")}>
            <span>DeutschHub</span>
          </div>
        )}
      </div>

      <div className={cx("content")}>
        <h4 className={cx("title")}>{article.title}</h4>

        <div className={cx("meta")}>
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
            </time>
          )}

          {article.readingTime != null && (
            <span>{article.readingTime} phút đọc</span>
          )}
        </div>
      </div>
    </AppLink>
  );
}

export default ArticlePreview;
