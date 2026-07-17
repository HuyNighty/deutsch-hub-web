import { useParams } from "react-router-dom";
import useLessonDetail from "./hooks/useLessonDetail";
import LessonItemRenderer from "./components/LessonItemRenderer";
import LessonNavigation from "./components/LessonNavigation";
import LessonHeader from "./components/LessonHeader";
import CompleteLessonButton from "../lesson-complete/components/CompleteLessonButton";
import { useEffect, useState } from "react";

function LessonDetail() {
  const { courseId, lessonId } = useParams();

  const { lesson, loading, error } = useLessonDetail(courseId, lessonId);

  const [lessonState, setLessonState] = useState(null);

  useEffect(() => {
    setLessonState(lesson);
  }, [lesson]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Some thing went wrong...!</p>;
  }

  if (!lessonState) return null;

  return (
    <>
      <LessonHeader lesson={lessonState} />
      <LessonItemRenderer items={lessonState.items} />
      <CompleteLessonButton
        courseId={courseId}
        lessonId={lessonState.id}
        estimatedMinutes={lessonState.estimatedMinutes}
        completed={lessonState.completed}
        onCompleted={() => {
          setLessonState({ ...lessonState, completed: true });
        }}
      />
      <LessonNavigation
        courseId={courseId}
        previousLessonId={lessonState.previousLessonId}
        nextLessonId={lessonState.nextLessonId}
      />
    </>
  );
}

export default LessonDetail;
