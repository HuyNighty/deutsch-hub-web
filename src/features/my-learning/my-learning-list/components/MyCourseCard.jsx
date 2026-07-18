import { useNavigate } from "react-router-dom";
import MyCourseProgressBar from "./MyCourseProgressBar";

function MyCourseCard({ course }) {
  const navigate = useNavigate();

  return (
    <div>
      <h2>{course.title}</h2>

      <p>{course.description}</p>

      <MyCourseProgressBar
        completedLessons={course.completedLessons}
        totalLessons={course.totalLessons}
        completionPercentage={course.completionPercentage}
      />

      <button
        onClick={() => navigate(`/my-learning/courses/${course.courseId}`)}
      >
        Continue Learning
      </button>
    </div>
  );
}

export default MyCourseCard;
