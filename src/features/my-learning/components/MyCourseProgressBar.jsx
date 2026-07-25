function MyCourseProgressBar({
  completedLessons,
  totalLessons,
  completionPercentage,
}) {
  return (
    <>
      <p>
        {completedLessons} / {totalLessons} lessons
      </p>

      <progress value={completionPercentage} />

      <p>{completionPercentage}%</p>
    </>
  );
}

export default MyCourseProgressBar;
