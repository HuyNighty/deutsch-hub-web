import styles from "../research.module.css";

export default function PublicHome({ fixture }) {
  return (
    <>
      <p className={styles.eyebrow}>NGÔN NGỮ · CUỘC SỐNG · CÂU CHUYỆN</p>
      <h1 id="specimen-heading" className={styles.title}>{fixture.heading}</h1>
      <p className={styles.lead}>{fixture.invitation}</p>
      <div className={styles.editorialNote}>
        <p>Một điểm bắt đầu, nhiều điều để tìm hiểu.</p>
        <p className={styles.secondary}>Khám phá những trang đọc về nước Đức theo nhịp của bạn.</p>
      </div>
      <button className={styles.action} disabled aria-describedby="static-specimen-note">{fixture.action} <span aria-hidden="true">→</span></button>
    </>
  );
}
