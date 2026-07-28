import styles from "./Button.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

const VARIANTS = ["primary", "outline"];
const SIZES = ["sm", "md", "lg"];

function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}) {
  const buttonVariant = VARIANTS.includes(variant) ? variant : "primary";
  const buttonSize = SIZES.includes(size) ? size : "md";
  return (
    <button
      disabled={disabled || loading}
      className={cx(
        "button",
        buttonVariant,
        buttonSize,
        { fullWidth, loading },
        className,
      )}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}

export default Button;
