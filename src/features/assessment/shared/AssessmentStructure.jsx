import classNames from "classnames/bind";
import { skillLabels, executionModeLabels } from "./assessment-presentation";
import styles from "./Assessment.module.scss";

const cx = classNames.bind(styles);

export default function AssessmentStructure({ components }) {
  return (
    <div className={cx("components")}>
      {components.map((component) => (
        <section className={cx("card")} key={component.componentId}>
          <h2 className={cx("cardTitle")}>{skillLabels[component.skillDimension]}</h2>
          <p className={cx("metadata")}>Execution mode: {executionModeLabels[component.executionMode]}</p>
          <ul className={cx("tasks")}>
            {component.tasks.map((task) => <li key={task.taskId}>Task {task.order}</li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}
