import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/ui/components/button";

import classNames from "classnames/bind";
import styles from "./MyCourseCard.module.scss";
import MyCourseProgressBar from "../MyCourseProgressBar/MyCourseProgressBar";

const cx = classNames.bind(styles);

export default function MyCourseCard({ course }) {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate(`/my-learning/courses/${course.courseId}`);
  };

  return (
    <article className={cx("card")}>
      <header className={cx("header")}>
        <h2 className={cx("title")}>{course.title}</h2>

        {course.description && (
          <p className={cx("description")}>{course.description}</p>
        )}
      </header>

      <MyCourseProgressBar
        completedLessons={course.completedLessons}
        totalLessons={course.totalLessons}
        completionPercentage={course.completionPercentage}
      />

      <footer className={cx("footer")}>
        <Button variant="outline" onClick={handleContinue}>
          Continue Learning
        </Button>
      </footer>
    </article>
  );
}
