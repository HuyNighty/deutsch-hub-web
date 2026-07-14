export default function LessonItem({ lesson }) {
  return (
    <li>
      <strong>{lesson.title}</strong>
      <br />
      {lesson.description}
      <br />
      {lesson.estimatedMinutes} minutes
    </li>
  );
}
