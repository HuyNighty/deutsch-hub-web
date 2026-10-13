import { useEffect, useRef, useState } from "react";
import Specimen from "./Specimen";
import InteractionSpecimen from "./InteractionSpecimen";
import ParticipantAssessment from "./ParticipantAssessment";
import ParticipantReturning from "./ParticipantReturning";
import { surfaces } from "./surfaces";
import { scenarioLabels } from "./interaction-fixtures";
import { assessmentCases, validPendingInterval } from "./participant-scenarios";
import base from "./research.module.css";
import styles from "./participant.module.css";

export default function ParticipantHarness() {
  const [stage, setStage] = useState("setup");
  const [study, setStudy] = useState("surface");
  const [model, setModel] = useState("A");
  const [context, setContext] = useState("publicHome");
  const [caseId, setCaseId] = useState("draft");
  const [returning, setReturning] = useState("R1");
  const [pendingMs, setPendingMs] = useState("");
  const [configuration, setConfiguration] = useState(null);
  const introduction = useRef(null);
  useEffect(() => { introduction.current?.focus(); }, [stage]);
  const needsInterval = study === "assessment" && assessmentCases[caseId].live;

  function prepare(event) {
    event.preventDefault();
    if (needsInterval && !validPendingInterval(pendingMs)) return;
    setConfiguration(Object.freeze({ study, model, context, caseId, returning, pendingMs: Number(pendingMs) }));
    setStage("ready");
  }
  const notice = "Prototype tổng hợp dùng cho nghiên cứu; không phải ứng dụng đang vận hành. Không kết nối Backend và không lưu dữ liệu học tập.";
  return <div className={[base.harness, styles.participant].join(" ")}>
    {stage === "setup" && <main className={styles.setup}>
      <h1 ref={introduction} tabIndex={-1}>Thiết lập riêng — người điều phối</h1>
      <p>Chỉ thiết lập khi người tham gia đã bàn giao máy. Giữ cùng mẫu trong khối quay lại; đổi mẫu bắt đầu khối mới. Thứ tự nghiên cứu được chuẩn bị trước, không tự chọn mẫu thắng.</p>
      <form onSubmit={prepare}>
        <label>Nghiên cứu<select value={study} onChange={(event) => setStudy(event.target.value)}>
          <option value="surface">S1 — Nhận biết bề mặt</option><option value="assessment">S2 — Tương tác đánh giá</option><option value="returning">S3 — Quay lại việc học</option>
        </select></label>
        <label>Mẫu<select value={model} onChange={(event) => setModel(event.target.value)}><option value="A">Mẫu A</option><option value="B">Mẫu B</option></select></label>
        {study === "surface" && <label>Bối cảnh<select value={context} onChange={(event) => setContext(event.target.value)}>
          {Object.entries(surfaces).map(([value, surface]) => <option key={value} value={value}>{surface.label}</option>)}
        </select></label>}
        {study === "assessment" && <label>Tình huống đánh giá<select value={caseId} onChange={(event) => setCaseId(event.target.value)}>
          {Object.entries(assessmentCases).map(([value, scenario]) => <option key={value} value={value}>{scenario.label}</option>)}
        </select></label>}
        {needsInterval && <label>Khoảng chờ hiệu chỉnh (ms)<input type="number" min="100" max="60000" step="1" required
          value={pendingMs} onChange={(event) => setPendingMs(event.target.value)} aria-describedby="interval-note" /></label>}
        {study === "returning" && <label>Tình huống quay lại<select value={returning} onChange={(event) => setReturning(event.target.value)}>
          {Object.entries(scenarioLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>}
        <p id="interval-note">Chưa có thời lượng chờ được chấp nhận. Nhập thời lượng để hiệu chỉnh khả năng tiếp cận, dùng cùng giá trị cho các trường hợp so sánh. Trạng thái có sẵn chỉ kiểm tra hiểu nội dung, không kiểm tra thông báo chuyển tiếp trực tiếp.</p>
        <button type="submit" className={base.secondaryAction}>Chuẩn bị bàn giao</button>
      </form>
    </main>}
    {stage === "ready" && <main className={styles.setup}>
      <h1 ref={introduction} tabIndex={-1}>Sẵn sàng bắt đầu</h1><p role="note">{notice}</p>
      <p>Người điều phối bàn giao bàn phím và chuột trước khi bắt đầu. Bạn có thể tạm dừng bất kỳ lúc nào.</p>
      <button type="button" className={base.secondaryAction} onClick={() => setStage("task")}>Bắt đầu tình huống</button>
    </main>}
    {stage === "task" && <>
      <header className={styles.introduction}>
        <p ref={introduction} tabIndex={-1} role="note" aria-label="Thông tin nghiên cứu">{notice}</p>
        {configuration.study === "surface" && <p id="static-specimen-note">Bản trình bày tĩnh; các thao tác bị vô hiệu hóa.</p>}
        {configuration.study === "assessment" && assessmentCases[configuration.caseId].snapshot && <p>Trạng thái được chuẩn bị sẵn để đọc và nhận biết; không phải chuyển tiếp trực tiếp.</p>}
      </header>
      {configuration.study === "surface"
        ? <Specimen contextId={configuration.context} model={configuration.model} />
        : <InteractionSpecimen contextId={configuration.study === "assessment" ? "assessment" : "myLearning"} model={configuration.model}>
          {configuration.study === "assessment"
            ? <ParticipantAssessment caseId={configuration.caseId} pendingMs={configuration.pendingMs} />
            : <ParticipantReturning scenario={configuration.returning} />}
        </InteractionSpecimen>}
      <footer className={styles.introduction}><button type="button" className={base.secondaryAction} onClick={() => setStage("pause")}>Tạm dừng và bàn giao</button></footer>
    </>}
    {stage === "pause" && <main className={styles.setup}>
      <h1 ref={introduction} tabIndex={-1}>Tạm dừng nghiên cứu</h1>
      <p>Chỉ người điều phối tiếp tục thiết lập sau khi bạn bàn giao máy. Mọi thao tác đang chờ đã dừng.</p>
      <button type="button" className={base.secondaryAction} onClick={() => { setConfiguration(null); setStage("setup"); }}>Bàn giao cho người điều phối</button>
    </main>}
  </div>;
}
