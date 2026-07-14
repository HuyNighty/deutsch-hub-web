import LessonItem from "./LessonItem";

export default function LessonList({ lessons }) {
  return (
    <ul>
      {lessons.map((lesson) => (
        <LessonItem key={lesson.id} lesson={lesson} />
      ))}
    </ul>
  );
}
