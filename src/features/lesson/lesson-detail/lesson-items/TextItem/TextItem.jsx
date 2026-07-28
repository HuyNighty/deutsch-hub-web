import classNames from "classnames/bind";
import styles from "./TextItem.module.scss";

const cx = classNames.bind(styles);

export default function TextItem({ item }) {
  return (
    <article className={cx("text")}>
      {item.title && <h2 className={cx("title")}>{item.title}</h2>}

      {item.description && (
        <p className={cx("description")}>{item.description}</p>
      )}

      <div
        className={cx("content")}
        dangerouslySetInnerHTML={{
          __html: item.content,
        }}
      />
    </article>
  );
}
