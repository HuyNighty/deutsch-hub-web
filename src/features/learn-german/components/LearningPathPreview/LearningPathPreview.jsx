import classNames from "classnames/bind";

import styles from "./LearningPathPreview.module.scss";

const cx = classNames.bind(styles);

const levels = [
  {
    code: "A1",
    title: "Sơ cấp 1",
    description: "Bắt đầu làm quen với tiếng Đức",
  },
  {
    code: "A2",
    title: "Sơ cấp 2",
    description: "Giao tiếp trong những tình huống hàng ngày",
  },
  {
    code: "B1",
    title: "Trung cấp 1",
    description: "Hiểu và diễn đạt rõ ràng hơn",
  },
  {
    code: "B2",
    title: "Trung cấp 2",
    description: "Tự tin giao tiếp và mở rộng vốn từ",
  },
  {
    code: "C1",
    title: "Cao cấp 1",
    description: "Sử dụng tiếng Đức linh hoạt, học thuật",
  },
  {
    code: "C2",
    title: "Cao cấp 2",
    description: "Làm chủ ngôn ngữ ở mức gần như bản xứ",
  },
];

export default function LearningPathPreview() {
  return (
    <section className={cx("card")} aria-labelledby="learning-path-title">
      <div className={cx("intro")}>
        <span className={cx("eyebrow")}>LỘ TRÌNH TIẾNG ĐỨC</span>

        <h2 id="learning-path-title" className={cx("title")}>
          Từng bước chinh phục
          <br />
          tiếng Đức
        </h2>

        <p className={cx("description")}>
          Từ những bài học đầu tiên đến giao tiếp tự tin – bạn sẽ luôn biết mình
          đang ở đâu và cần đi tiếp như thế nào.
        </p>

        <a href="#learning-path" className={cx("link")}>
          Xem chi tiết lộ trình
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <div
        id="learning-path"
        className={cx("levels")}
        aria-label="Các cấp độ tiếng Đức từ A1 đến C2"
      >
        {levels.map((level, index) => (
          <div key={level.code} className={cx("level-wrapper")}>
            <div className={cx("level-item")}>
              <span
                className={cx("level", {
                  active: index === 0,
                })}
              >
                {level.code}
              </span>

              <strong className={cx("level-title")}>{level.title}</strong>

              <span className={cx("level-description")}>
                {level.description}
              </span>
            </div>

            {index < levels.length - 1 && (
              <span className={cx("line")} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      <div className={cx("decoration")} aria-hidden="true" />
    </section>
  );
}
