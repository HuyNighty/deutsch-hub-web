export default function MyCourseProgress({ course }) {
  return (
    <>
      <h2>Learning Progress</h2>

      <p>Status: {course.enrollmentStatus}</p>

      <p>Progress: {course.completionPercentage}%</p>

      <p>
        Lessons: {course.completedLessons}/{course.totalLessons}
      </p>

      <p>Study Minutes: {course.totalStudyMinutes}</p>
    </>
  );
}
