import { useState } from "react";
import Specimen from "./Specimen";
import { surfaces, models } from "./surfaces";
import styles from "./research.module.css";

export default function ResearchHarness() {
  const [contextId, setContextId] = useState("publicHome");
  const [model, setModel] = useState("A");

  return (
    <div className={styles.harness}>
      <header className={styles.controls}>
        <div className={styles.controlHeading}>
          <p className={styles.brand}>DEUTSCHHUB <span>RESEARCH / P3-A</span></p>
          <p className={styles.controlTitle}>Nghiên cứu bề mặt đọc</p>
        </div>
        <div className={styles.controlFields}>
          <label className={styles.contextControl}>
            Bối cảnh
            <select value={contextId} onChange={(event) => setContextId(event.target.value)}>
              {Object.entries(surfaces).map(([id, surface]) => <option key={id} value={id}>{surface.label}</option>)}
            </select>
          </label>
          <fieldset className={styles.modelControl}>
            <legend>Mẫu so sánh</legend>
            {Object.keys(models).map((value) => (
              <label key={value}>
                <input type="radio" name="surface-model" value={value} checked={model === value}
                  onChange={() => setModel(value)} />
                Mẫu {value}
              </label>
            ))}
          </fieldset>
        </div>
        <div className={styles.notice} role="note" aria-label="Thông tin nghiên cứu">
          <p>Chỉ dành cho nghiên cứu. Nội dung là dữ liệu mẫu, thiết kế đang thử nghiệm,
            không kết nối API trực tiếp và không phải ứng dụng đang vận hành.</p>
          <p id="static-specimen-note">Các nút và đáp án trong mẫu chỉ để minh họa; không điều hướng hoặc lưu dữ liệu.</p>
        </div>
        <p className={styles.modelDescription}><span lang="en">A: {models.A} · B: {models.B}</span>
          {contextId === "assessment" && " · Bối cảnh đối chứng; không dùng để quyết định mẫu thắng."}</p>
      </header>
      <Specimen contextId={contextId} model={model} />
    </div>
  );
}
