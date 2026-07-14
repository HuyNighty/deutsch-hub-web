import CourseSection from "./CourseSection";

export default function CourseSectionList({ sections }) {
  return (
    <section>
      <h2>Curriculum</h2>

      {sections.map((section) => (
        <CourseSection key={section.id} section={section} />
      ))}
    </section>
  );
}
