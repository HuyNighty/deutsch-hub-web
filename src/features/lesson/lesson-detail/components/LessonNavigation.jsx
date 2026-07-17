import { useNavigate } from "react-router-dom";

export default function LessonNavigation({
  courseId,
  previousLessonId,
  nextLessonId,
}) {
  const navigate = useNavigate();

  return (
    <div>
      <button
        disabled={!previousLessonId}
        onClick={() =>
          navigate(
            `/my-learning/courses/${courseId}/lessons/${previousLessonId}`,
          )
        }
      >
        Previous
      </button>

      <button
        disabled={!nextLessonId}
        onClick={() =>
          navigate(`/my-learning/courses/${courseId}/lessons/${nextLessonId}`)
        }
      >
        Next
      </button>
    </div>
  );
}
