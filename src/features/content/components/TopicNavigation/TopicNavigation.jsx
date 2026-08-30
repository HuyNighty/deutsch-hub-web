import classNames from "classnames/bind";

import styles from "./TopicNavigation.module.scss";

const cx = classNames.bind(styles);

const topics = [
  {
    id: "language",
    number: "01",
    title: "Ngôn ngữ",
    description: "Tiếng Đức, từ vựng và cách giao tiếp.",
  },
  {
    id: "culture",
    number: "02",
    title: "Văn hóa",
    description: "Phong tục, lễ hội và những giá trị đặc trưng.",
  },
  {
    id: "life",
    number: "03",
    title: "Đời sống",
    description: "Cuộc sống thường ngày và con người nước Đức.",
  },
  {
    id: "travel",
    number: "04",
    title: "Du lịch",
    description: "Điểm đến, hành trình và những trải nghiệm đáng nhớ.",
  },
  {
    id: "food",
    number: "05",
    title: "Ẩm thực",
    description: "Món ăn, thức uống và văn hóa bàn ăn.",
  },
  {
    id: "education",
    number: "06",
    title: "Giáo dục",
    description: "Học tập, đại học và con đường phát triển.",
  },
  {
    id: "economy",
    number: "07",
    title: "Kinh tế",
    description: "Doanh nghiệp, thị trường và nền kinh tế Đức.",
  },
  {
    id: "history",
    number: "08",
    title: "Lịch sử",
    description: "Những câu chuyện đã tạo nên nước Đức hôm nay.",
  },
];

function TopicNavigation() {
  return (
    <nav className={cx("navigation")} aria-label="Khám phá theo chủ đề">
      <div className={cx("header")}>
        <div>
          <span className={cx("eyebrow")}>MỤC LỤC</span>

          <h2 className={cx("title")}>Khám phá nước Đức</h2>
        </div>

        <p className={cx("intro")}>
          Chọn một chủ đề để bắt đầu hành trình khám phá của riêng bạn.
        </p>
      </div>

      <div className={cx("topics")}>
        {topics.map((topic) => (
          <a key={topic.id} href={`#topic-${topic.id}`} className={cx("topic")}>
            <span className={cx("number")}>{topic.number}</span>

            <span className={cx("content")}>
              <strong className={cx("name")}>{topic.title}</strong>

              <span className={cx("description")}>{topic.description}</span>
            </span>

            <span className={cx("arrow")} aria-hidden="true">
              ↗
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}

export default TopicNavigation;
