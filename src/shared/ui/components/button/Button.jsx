import classNames from "classnames/bind";

import styles from "./Button.module.scss";
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
  disabled = false,
  type = "button",
  ...props
}) {
  const buttonVariant = VARIANTS.includes(variant) ? variant : "primary";

  const buttonSize = SIZES.includes(size) ? size : "md";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cx(
        "button",
        buttonVariant,
        buttonSize,
        {
          fullWidth,
          loading,
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
