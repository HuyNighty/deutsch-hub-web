import base from "../research.module.css";
import styles from "../interaction.module.css";

const destinationCopy = {
  course: "Khóa học đang học",
  lesson: "Bài học tiếp theo",
  assessment: "Bài đánh giá đang thực hiện",
  task: "Bài tập đánh giá đang thực hiện",
  catalog: "Khám phá khóa học",
};

export default function ReturningProbe({ scenario, fixture, destination, onChoose }) {
  const course = fixture.journey.courses[0];
  if (destination) return (
    <section data-testid="research-destination" data-kind={destination.kind}
      data-course-id={destination.target?.courseId} data-lesson-id={destination.target?.lessonId}
      data-assessment-attempt-id={destination.target?.assessmentAttemptId}
      data-task-id={destination.target?.taskId} data-quiz-attempt-id={destination.target?.quizAttemptId}>
      <p className={base.eyebrow}>ĐIỂM ĐẾN MÔ PHỎNG</p>
      <h1 id="interaction-heading" className={base.title}>{destinationCopy[destination.kind]}</h1>
      <p className={base.lead}>Đây là điểm đến trong nghiên cứu. Không tải nội dung hay thực hiện thao tác trên ứng dụng đang vận hành.</p>
    </section>
  );
  return (
    <>
      <p className={base.eyebrow}>QUAY LẠI VIỆC HỌC</p>
      <h1 id="interaction-heading" className={base.title}>Học tập của tôi</h1>
      {scenario === "R1" && <>
        <section className={base.course} aria-labelledby="returning-course-title">
          <h2 id="returning-course-title">{course.title}</h2>
          <p className={base.secondary}>Đang học</p>
          <div className={base.progressCaption}><span>{course.progress.completedLessons} / {course.progress.totalLessons} bài học</span><strong>{course.progress.completionPercentage}%</strong></div>
          <progress className={base.progress} aria-label="Tiến độ khóa học" value={course.progress.completionPercentage} max="100" />
          <button type="button" className={base.secondaryAction} onClick={() => onChoose({ kind: "course", target: fixture.direction.target })}>Tiếp tục học</button>
        </section>
        <section className={base.nextLesson} aria-labelledby="returning-next-title">
          <h2 id="returning-next-title">Bước tiếp theo</h2>
          <p className={base.secondary}>Tiếp tục với bài học tiếp theo của bạn.</p>
          <button type="button" className={base.action} onClick={() => onChoose({ kind: "lesson", target: fixture.nextActivity.target })}>Mở bài học tiếp theo</button>
        </section>
      </>}
      {scenario === "R2" && <section className={styles.returningSection} aria-labelledby="returning-assessment-title">
        <h2 id="returning-assessment-title">Bạn đang thực hiện một bài đánh giá</h2>
        <p>Bài đánh giá và bài tập đang thực hiện; chưa có kết quả chính thức.</p>
        <div className={styles.buttons}>
          <button type="button" className={base.secondaryAction} onClick={() => onChoose({ kind: "assessment", target: fixture.direction.target })}>Tiếp tục đánh giá</button>
          <button type="button" className={base.action} onClick={() => onChoose({ kind: "task", target: fixture.nextActivity.target })}>Tiếp tục bài tập</button>
        </div>
      </section>}
      {scenario === "R3" && <section className={styles.returningSection} aria-labelledby="returning-discovery-title">
        <h2 id="returning-discovery-title">Một điểm bắt đầu mới</h2>
        <p>Chọn một khóa học để bắt đầu học tiếng Đức theo nhịp của bạn.</p>
        <button type="button" className={base.action} onClick={() => onChoose({ kind: "catalog", target: null })}>Khám phá khóa học</button>
      </section>}
    </>
  );
}
