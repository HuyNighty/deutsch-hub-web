import LessonList from "./LessonList";

export default function CourseSection({ section }) {
  return (
    <div>
      <h3>{section.title}</h3>

      <p>{section.description}</p>

      <LessonList lessons={section.lessons} />
    </div>
  );
}
