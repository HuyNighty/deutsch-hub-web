import classNames from "classnames/bind";
import styles from "./TopicNavigation.module.scss";
import { FlowingMenu } from "../FlowingMenu";

const cx = classNames.bind(styles);

const topics = [
  {
    id: "language",
    number: "01",
    title: "Ngôn ngữ",
    description: "Tiếng Đức, từ vựng và cách giao tiếp.",
    image: "public/images/learning-german.png",
  },
  {
    id: "culture",
    number: "02",
    title: "Văn hóa",
    description: "Phong tục, lễ hội và những giá trị đặc trưng.",
    image: "/images/topics/culture.jpg",
  },
  {
    id: "life",
    number: "03",
    title: "Đời sống",
    description: "Cuộc sống thường ngày và con người nước Đức.",
    image: "/images/topics/life.jpg",
  },
  {
    id: "travel",
    number: "04",
    title: "Du lịch",
    description: "Điểm đến, hành trình và những trải nghiệm đáng nhớ.",
    image: "/images/topics/travel.jpg",
  },
  {
    id: "food",
    number: "05",
    title: "Ẩm thực",
    description: "Món ăn, thức uống và văn hóa bàn ăn.",
    image: "/images/topics/food.jpg",
  },
  {
    id: "education",
    number: "06",
    title: "Giáo dục",
    description: "Học tập, đại học và con đường phát triển.",
    image: "/images/topics/education.jpg",
  },
  {
    id: "economy",
    number: "07",
    title: "Kinh tế",
    description: "Doanh nghiệp, thị trường và nền kinh tế Đức.",
    image: "/images/topics/economy.jpg",
  },
  {
    id: "history",
    number: "08",
    title: "Lịch sử",
    description: "Những câu chuyện đã tạo nên nước Đức hôm nay.",
    image: "/images/topics/history.jpg",
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
          <FlowingMenu
            key={topic.id}
            number={topic.number}
            title={topic.title}
            description={topic.description}
            image={topic.image}
            link={`/explore-germany/category/${topic.id}`}
          />
        ))}
      </div>
    </nav>
  );
}

export default TopicNavigation;
