import { Link } from "react-router-dom";

export default function MyCourseSectionList({ courseId, sections }) {
  return (
    <>
      <h2>Sections</h2>

      {sections.map((section) => (
        <div key={section.id}>
          <h3>{section.title}</h3>

          <p>{section.description}</p>

          <ul>
            {section.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  to={`/my-learning/courses/${courseId}/lessons/${lesson.id}`}
                >
                  {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
