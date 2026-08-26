import classNames from "classnames/bind";
import styles from "./Input.module.scss";

const cx = classNames.bind(styles);

function Input({ id, label, error, required = false, className, ...props }) {
  return (
    <div className={cx("field", className)}>
      {label && (
        <label htmlFor={id} className={cx("label")}>
          {label}
          {required && <span className={cx("required")}>*</span>}
        </label>
      )}

      <input id={id} className={cx("input", { error })} {...props} />

      {error && <p className={cx("errorMessage")}>{error}</p>}
    </div>
  );
}

export default Input;
