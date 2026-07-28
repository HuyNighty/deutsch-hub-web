import classNames from "classnames/bind";

import styles from "./VideoItem.module.scss";

const cx = classNames.bind(styles);

export default function VideoItem({ item }) {
  return (
    <article className={cx("video")}>
      {item.title && <h2 className={cx("title")}>{item.title}</h2>}

      {item.description && (
        <p className={cx("description")}>{item.description}</p>
      )}

      <video className={cx("player")} controls>
        <source src={item.resourceUrl} />
        Your browser does not support the video tag.
      </video>
    </article>
  );
}
