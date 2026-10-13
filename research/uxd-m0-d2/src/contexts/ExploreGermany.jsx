import styles from "../research.module.css";

export default function ExploreGermany({ fixture }) {
  return (
    <>
      <p className={styles.eyebrow}>KHÁM PHÁ NƯỚC ĐỨC</p>
      <h1 id="specimen-heading" className={styles.title}>{fixture.article.title}</h1>
      <p className={styles.lead}>{fixture.article.summary}</p>
      <div className={styles.editorialNote}>
        <p lang="de">Ein neues Kapitel beginnt mit einer Frage.</p>
        <p className={styles.secondary}>Bắt đầu từ một câu hỏi, rồi mở ra một góc nhìn mới.</p>
      </div>
      <button className={styles.action} disabled aria-describedby="static-specimen-note">Đọc bài viết <span aria-hidden="true">→</span></button>
    </>
  );
}
