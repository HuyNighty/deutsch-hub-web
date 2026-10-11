import classNames from "classnames/bind";
import { skillLabels, executionModeLabels } from "./assessment-presentation";
import styles from "./Assessment.module.scss";

const cx = classNames.bind(styles);

export default function AssessmentStructure({ components, renderTaskAction }) {
  return (
    <div className={cx("components")}>
      {components.map((component) => (
        <section className={cx("card")} key={component.componentId}>
          <h2 lang="vi" className={cx("cardTitle")}>{skillLabels[component.skillDimension]}</h2>
          <p lang="vi" className={cx("metadata")}>Cách thực hiện: {executionModeLabels[component.executionMode]}</p>
          <ul className={cx("tasks")}>
            {component.tasks.map((task) => (
              <li key={task.taskId}>
                <span lang="vi">Bài tập {task.order}</span>
                {renderTaskAction?.(task)}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
