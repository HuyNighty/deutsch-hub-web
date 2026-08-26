import { Button } from "@/shared/ui/components/button";
import useCompleteLesson from "../hooks/useCompleteLesson";

export default function CompleteLessonButton({
  courseId,
  lesson,
  onCompleted,
}) {
  const { id, completed, estimatedMinutes } = lesson;

  const { loading, error, handleComplete } = useCompleteLesson();

  const handleClick = async () => {
    const success = await handleComplete(courseId, id, estimatedMinutes);

    if (success) {
      onCompleted();
    }
  };

  if (completed) {
    return (
      <Button fullWidth disabled>
        Completed
      </Button>
    );
  }

  return (
    <>
      <Button fullWidth loading={loading} onClick={handleClick}>
        Complete Lesson
      </Button>

      {error && <p className="error">Failed to complete lesson.</p>}
    </>
  );
}
