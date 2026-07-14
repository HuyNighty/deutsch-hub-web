import { Link } from "react-router-dom";

export default function CourseItem({ course }) {
  return (
    <li>
      <Link to={`/learn-german/courses/${course.id}`}>
        <strong>{course.title}</strong>
      </Link>

      <br />

      {course.level}

      <br />

      {course.description}
    </li>
  );
}
