import styles from "../research.module.css";

export default function Assessment({ fixture }) {
  const question = fixture.runtime.questions[0];
  return (
    <>
      <p className={styles.eyebrow}>BÀI ĐÁNH GIÁ</p>
      <h1 id="specimen-heading" className={styles.title}>Một khoảng lặng để tập trung</h1>
      <p className={styles.lead}>Trạng thái bài tập: Đang thực hiện</p>
      <fieldset className={styles.question}>
        <legend>Câu hỏi {question.order} · Chọn nhiều đáp án</legend>
        <p lang="de" className={styles.questionText}>{question.content}</p>
        <div className={styles.options}>
          {question.options.map((option) => (
            <label className={styles.option} key={option.answerId}>
              <input type="checkbox" checked={question.selectedAnswerIds.includes(option.answerId)} disabled />
              <span lang="de">{option.content}</span>
            </label>
          ))}
        </div>
        <p className={styles.secondary}>Lựa chọn đã lưu: A.</p>
      </fieldset>
    </>
  );
}
