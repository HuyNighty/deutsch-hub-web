import classNames from "classnames/bind";
import DOMPurify from "dompurify";
import styles from "./TextItem.module.scss";

const cx = classNames.bind(styles);

export default function TextItem({ item }) {
  // Persisted lesson HTML is untrusted, including content authored by an admin.
  const content = item.content ?? "";
  const sanitizedContent = DOMPurify.isSupported
    ? DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li"],
        ALLOWED_ATTR: [],
        ALLOW_DATA_ATTR: false,
        ALLOW_ARIA_ATTR: false,
      })
    : null;

  return (
    <article className={cx("text")}>
      {item.title && <h2 className={cx("title")}>{item.title}</h2>}

      {item.description && (
        <p className={cx("description")}>{item.description}</p>
      )}

      <div
        className={cx("content")}
        dangerouslySetInnerHTML={
          sanitizedContent === null ? undefined : { __html: sanitizedContent }
        }
      >
        {sanitizedContent === null ? content : null}
      </div>
    </article>
  );
}
