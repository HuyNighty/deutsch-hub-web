import useCompleteLesson from "../hooks/useCompleteLesson";

function CompleteLessonButton({
  courseId,
  lessonId,
  estimatedMinutes,
  completed,
  onCompleted,
}) {
  const { loading, error, handleComplete } = useCompleteLesson();

  async function onClick() {
    const success = await handleComplete(courseId, lessonId, estimatedMinutes);

    if (success) {
      onCompleted();
    }
  }

  if (completed) {
    return (
      <>
        <button disabled>COMPLETED</button>
      </>
    );
  }

  return (
    <>
      <button disabled={loading} onClick={onClick}>
        {loading ? "COMPLETING..." : "COMPLETE LESSON"}
      </button>

      {error && <p>Failed to complete lesson.</p>}
    </>
  );
}

export default CompleteLessonButton;
