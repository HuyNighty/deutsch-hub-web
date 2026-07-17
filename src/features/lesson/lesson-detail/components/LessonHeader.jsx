export default function LessonHeader({ lesson }) {
  return (
    <header>
      <h1>{lesson.title}</h1>

      <p>{lesson.description}</p>

      <div>
        <span>Level: {lesson.level}</span>
        {" • "}
        <span>{lesson.estimatedMinutes} minutes</span>
      </div>
    </header>
  );
}
