export default function CourseHeader({ course }) {
  return (
    <header>
      <h1>{course.title}</h1>

      <p>Level: {course.level}</p>

      <p>
        {course.estimatedHours} hour
        {course.estimatedHours > 1 ? "s" : ""}
      </p>

      <p>
        {course.price} {course.currency}
      </p>
    </header>
  );
}
