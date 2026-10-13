import { useEffect, useReducer, useRef, useState } from "react";
import { assessmentTransition, initialAssessmentState, isUnresolved, sameSelection } from "./interaction-state";
import { scenarioLabels, returningFixtures } from "./interaction-fixtures";
import { models } from "./surfaces";
import InteractionSpecimen from "./InteractionSpecimen";
import AssessmentProbe from "./probes/AssessmentProbe";
import ReturningProbe from "./probes/ReturningProbe";
import base from "./research.module.css";
import styles from "./interaction.module.css";

export default function InteractionHarness() {
  const [mode, setMode] = useState("assessment");
  const [scenario, setScenario] = useState("R1");
  const [model, setModel] = useState("A");
  const [destination, setDestination] = useState(null);
  const [state, dispatch] = useReducer(assessmentTransition, undefined, initialAssessmentState);
  // A retained script ticket allows a facilitator to explicitly test stale rejection.
  // It is not an active operation, a persisted record or participant tracking.
  const lastTicket = useRef(null);
  useEffect(() => { if (state.operation) lastTicket.current = state.operation; }, [state.operation]);

  function reset() { dispatch({ type: "reset" }); setDestination(null); }
  function configure(setValue, value) { reset(); setValue(value); }
  const pending = state.phase === "pending";
  const blocked = isUnresolved(state) || state.taskStatus !== "IN_PROGRESS";
  const dirty = !sameSelection(state.draft, state.saved);
  const staleAvailable = lastTicket.current && lastTicket.current.epoch !== state.epoch;

  return (
    <div className={base.harness}>
      <header className={`${base.controls} ${styles.controls}`}>
        <div>
          <p className={base.brand}>DEUTSCHHUB <span>RESEARCH / P3-B</span></p>
          <p className={base.controlTitle}>Nghiên cứu tương tác và quay lại việc học</p>
        </div>
        <div className={styles.selectors}>
          <label className={base.contextControl}>Chế độ
            <select value={mode} onChange={(event) => configure(setMode, event.target.value)}>
              <option value="assessment">Tương tác đánh giá</option>
              <option value="returning">Quay lại việc học</option>
            </select>
          </label>
          <label className={base.contextControl}>Tình huống quay lại
            <select value={scenario} disabled={mode !== "returning"} onChange={(event) => configure(setScenario, event.target.value)}>
              {Object.entries(scenarioLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <fieldset className={base.modelControl}>
            <legend>Mẫu so sánh</legend>
            {Object.keys(models).map((value) => <label key={value}>
              <input type="radio" name="interaction-model" checked={model === value} onChange={() => configure(setModel, value)} />Mẫu {value}
            </label>)}
          </fieldset>
        </div>
        <div className={base.notice} role="note" aria-label="Thông tin nghiên cứu">
          <p>Nội dung tổng hợp, thiết kế thử nghiệm, không kết nối API và không phải ứng dụng đang vận hành.</p>
          <p>Mọi xác nhận chỉ có trong bộ nhớ mô phỏng; không chứng minh dữ liệu đã được lưu ở Backend.</p>
          <p>Giữ cùng mẫu khi so sánh R1–R3. Đổi mẫu bắt đầu một khối mới và đặt lại trạng thái.</p>
        </div>
        <fieldset className={styles.facilitator}>
          <legend>Điều khiển kịch bản — dành cho người điều phối</legend>
          {mode === "assessment" && <div className={styles.buttons}>
            <button type="button" disabled={blocked || !dirty} onClick={() => dispatch({ type: "start", kind: "save" })}>Bắt đầu mô phỏng lưu</button>
            <button type="button" disabled={blocked || dirty} onClick={() => dispatch({ type: "start", kind: "submit" })}>Bắt đầu mô phỏng nộp bài tập</button>
            <button type="button" disabled={!pending} onClick={() => dispatch({ type: "settle", ticket: state.operation, outcome: "confirmed" })}>Xác nhận kịch bản</button>
            <button type="button" disabled={!pending} onClick={() => dispatch({ type: "settle", ticket: state.operation, outcome: "error" })}>Lỗi xác định</button>
            <button type="button" disabled={!pending} onClick={() => dispatch({ type: "settle", ticket: state.operation, outcome: "uncertain" })}>Kết quả chưa xác định</button>
            <button type="button" disabled={!staleAvailable} onClick={() => dispatch({ type: "settle", ticket: lastTicket.current, outcome: "confirmed" })}>Gửi lại xác nhận cũ</button>
          </div>}
          <div className={styles.buttons}>
            <button type="button" onClick={reset}>Đặt lại nghiên cứu</button>
            {mode === "returning" && <button type="button" disabled={!destination} onClick={() => setDestination(null)}>Quay lại tình huống</button>}
          </div>
          {mode === "assessment" && <p className={styles.diagnostic}>Số thao tác mô phỏng: <output data-testid="operation-count">{state.started}</output>
            {state.ignored > 0 && <span role="status"> · Đã bỏ qua xác nhận ngoài khối: {state.ignored}</span>}</p>}
        </fieldset>
      </header>
      <InteractionSpecimen contextId={mode === "assessment" ? "assessment" : "myLearning"} model={model}>
        {mode === "assessment"
          ? <AssessmentProbe state={state} onEdit={(answerId) => dispatch({ type: "edit", answerId })} />
          : <ReturningProbe scenario={scenario} fixture={returningFixtures[scenario]} destination={destination} onChoose={setDestination} />}
      </InteractionSpecimen>
    </div>
  );
}
