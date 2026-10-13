import { useEffect, useRef, useState } from "react";
import { returningFixtures } from "./interaction-fixtures";
import base from "./research.module.css";
import interaction from "./interaction.module.css";

const destinationCopy = { course: "Khóa học đang học", lesson: "Bài học tiếp theo", assessment: "Bài đánh giá đang thực hiện", task: "Bài tập đánh giá đang thực hiện", catalog: "Khám phá khóa học" };

export default function ParticipantReturning({ scenario }) {
  const fixture = returningFixtures[scenario];
  const [destination, setDestination] = useState(null);
  const heading = useRef(null);
  const triggers = useRef({});
  const origin = useRef(null);
  useEffect(() => {
    if (destination) heading.current?.focus();
    else if (origin.current) triggers.current[origin.current]?.focus();
  }, [destination]);
  function choose(kind, target) {
    origin.current = kind;
    setDestination({ kind, target });
  }
  function action(kind, target, label, className) {
    return <button type="button" className={className} ref={(node) => { triggers.current[kind] = node; }} onClick={() => choose(kind, target)}>{label}</button>;
  }
  if (destination) return <section data-testid="research-destination" data-kind={destination.kind}
    data-course-id={destination.target?.courseId} data-lesson-id={destination.target?.lessonId}
    data-assessment-attempt-id={destination.target?.assessmentAttemptId} data-task-id={destination.target?.taskId}
    data-quiz-attempt-id={destination.target?.quizAttemptId}>
    <p className={base.eyebrow}>ĐIỂM ĐẾN MÔ PHỎNG</p>
    <h1 id="interaction-heading" className={base.title} ref={heading} tabIndex={-1}>{destinationCopy[destination.kind]}</h1>
    <p className={base.lead}>Đây là điểm đến trong nghiên cứu. Không tải nội dung hay thực hiện thao tác trên ứng dụng đang vận hành.</p>
    <div className={interaction.buttons}><button type="button" onClick={() => setDestination(null)}>Quay lại tình huống</button></div>
  </section>;
  const course = fixture.journey.courses[0];
  return <>
    <p className={base.eyebrow}>QUAY LẠI VIỆC HỌC</p>
    <h1 id="interaction-heading" className={base.title}>Học tập của tôi</h1>
    {scenario === "R1" && <>
      <section className={base.course} aria-labelledby="returning-course-title">
        <h2 id="returning-course-title">{course.title}</h2><p className={base.secondary}>Đang học</p>
        <div className={base.progressCaption}><span>{course.progress.completedLessons} / {course.progress.totalLessons} bài học</span><strong>{course.progress.completionPercentage}%</strong></div>
        <progress className={base.progress} aria-label="Tiến độ khóa học" value={course.progress.completionPercentage} max="100" />
        {action("course", fixture.direction.target, "Tiếp tục học", base.secondaryAction)}
      </section>
      <section className={base.nextLesson} aria-labelledby="returning-next-title">
        <h2 id="returning-next-title">Bước tiếp theo</h2><p className={base.secondary}>Tiếp tục với bài học tiếp theo của bạn.</p>
        {action("lesson", fixture.nextActivity.target, "Mở bài học tiếp theo", base.action)}
      </section>
    </>}
    {scenario === "R2" && <section className={interaction.returningSection} aria-labelledby="returning-assessment-title">
      <h2 id="returning-assessment-title">Bạn đang thực hiện một bài đánh giá</h2>
      <p>Bài đánh giá và bài tập đang thực hiện; chưa có kết quả chính thức.</p>
      <div className={interaction.buttons}>
        {action("assessment", fixture.direction.target, "Tiếp tục đánh giá", base.secondaryAction)}
        {action("task", fixture.nextActivity.target, "Tiếp tục bài tập", base.action)}
      </div>
    </section>}
    {scenario === "R3" && <section className={interaction.returningSection} aria-labelledby="returning-discovery-title">
      <h2 id="returning-discovery-title">Một điểm bắt đầu mới</h2><p>Chọn một khóa học để bắt đầu học tiếng Đức theo nhịp của bạn.</p>
      {action("catalog", null, "Khám phá khóa học", base.action)}
    </section>}
  </>;
}
