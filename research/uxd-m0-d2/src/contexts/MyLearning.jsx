import styles from "../research.module.css";

export default function MyLearning({ fixture }) {
  const course = fixture.journey.courses[0];
  const progress = course.progress;
  return (
    <>
      <p className={styles.eyebrow}>HÀNH TRÌNH HỌC TẬP</p>
      <h1 id="specimen-heading" className={styles.title}>Học tập của tôi</h1>
      <p className={styles.lead}>Tiếp tục khóa học bạn đang học, theo nhịp của bạn.</p>
      <section className={styles.course} aria-labelledby="research-course-title">
        <div className={styles.courseHeading}>
          <h2 id="research-course-title">{course.title}</h2>
          <span className={styles.stateLabel}>Đang học</span>
        </div>
        <div className={styles.progressCaption}>
          <span>{progress.completedLessons} / {progress.totalLessons} bài học</span>
          <strong>{progress.completionPercentage}%</strong>
        </div>
        <progress className={styles.progress} aria-label="Tiến độ khóa học" value={progress.completionPercentage} max="100" />
        <button className={styles.secondaryAction} disabled aria-describedby="static-specimen-note">Tiếp tục học</button>
      </section>
      <section className={styles.nextLesson} aria-labelledby="next-lesson-title">
        <h2 id="next-lesson-title">Bước tiếp theo</h2>
        <p className={styles.secondary}>Tiếp tục với bài học tiếp theo của bạn.</p>
        <button className={styles.action} disabled aria-describedby="static-specimen-note">Mở bài học tiếp theo <span aria-hidden="true">→</span></button>
      </section>
    </>
  );
}
