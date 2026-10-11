import classNames from "classnames/bind";
import styles from "./LessonMediaRenderer.module.scss";

import useLessonItemMedia from "@/features/media/hooks/useLessonItemMedia";

const cx = classNames.bind(styles);

function LessonMediaRenderer({
  courseId,
  lessonId,
  itemId,
  title,
  description,
}) {
  const { media, isPending, isError } = useLessonItemMedia(
    courseId,
    lessonId,
    itemId,
  );

  if (isPending) {
    return (
      <article className={cx("media-item")}>
        <div className={cx("header")}>
          <h2 className={cx("title")}>{title}</h2>

          {description && <p className={cx("description")}>{description}</p>}
        </div>

        <div className={cx("loading")}>Đang tải tài liệu...</div>
      </article>
    );
  }

  if (isError || !media) {
    return (
      <article className={cx("media-item")}>
        <div className={cx("header")}>
          <h2 className={cx("title")}>{title}</h2>

          {description && <p className={cx("description")}>{description}</p>}
        </div>

        <div className={cx("error")}>Không thể tải tài liệu bài học này.</div>
      </article>
    );
  }

  const { objectUrl, mimeType } = media;

  return (
    <article className={cx("media-item")}>
      <div className={cx("header")}>
        {title && <h2 className={cx("title")}>{title}</h2>}

        {description && <p className={cx("description")}>{description}</p>}
      </div>

      <div className={cx("media")}>
        {isImage(mimeType) && (
          <img
            className={cx("image")}
            src={objectUrl}
            alt={title || "Tài liệu bài học"}
            loading="lazy"
          />
        )}

        {isVideo(mimeType) && (
          <video className={cx("video")} controls preload="metadata">
            <source src={objectUrl} type={mimeType} />
          </video>
        )}

        {isAudio(mimeType) && (
          <audio className={cx("audio")} controls>
            <source src={objectUrl} type={mimeType} />
          </audio>
        )}

        {isPdf(mimeType) && (
          <iframe
            className={cx("pdf")}
            src={objectUrl}
            title={title || "Tài liệu PDF của bài học"}
          />
        )}

        {isDocument(mimeType) && (
          <div className={cx("document")}>
            <p className={cx("document-message")}>
              Không thể xem trước tài liệu này.
            </p>

            <a
              className={cx("download-link")}
              href={objectUrl}
              download={title}
            >
              Tải tài liệu
            </a>
          </div>
        )}

        {!isSupported(mimeType) && (
          <div className={cx("unsupported")}>Định dạng tài liệu không được hỗ trợ.</div>
        )}
      </div>
    </article>
  );
}

function isImage(mimeType) {
  return mimeType?.startsWith("image/");
}

function isVideo(mimeType) {
  return mimeType?.startsWith("video/");
}

function isAudio(mimeType) {
  return mimeType?.startsWith("audio/");
}

function isPdf(mimeType) {
  return mimeType === "application/pdf";
}

function isDocument(mimeType) {
  return mimeType === "text/plain" || mimeType?.startsWith("application/");
}

function isSupported(mimeType) {
  return (
    isImage(mimeType) ||
    isVideo(mimeType) ||
    isAudio(mimeType) ||
    isPdf(mimeType) ||
    isDocument(mimeType)
  );
}

export default LessonMediaRenderer;
