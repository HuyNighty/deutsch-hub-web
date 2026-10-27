import classNames from "classnames/bind";

import styles from "./Button.module.scss";

const cx = classNames.bind(styles);

const VARIANTS = ["primary", "outline"];
const SIZES = ["sm", "md", "lg"];

/**
 * DeutschHub Button B1 — Quiet Editorial.
 *
 * Backward compatible: existing variant/size/loading/disabled/fullWidth APIs
 * remain unchanged. `showArrow` is opt-in so form buttons do not unexpectedly
 * gain a decorative icon. Navigation remains the responsibility of AppLink.
 */
function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  showArrow = false,
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
        { fullWidth, loading },
        className,
      )}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
      {showArrow && !loading && (
        <span className={styles.arrow} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" focusable="false">
            <path
              d="M7 17 17 7M8 7h9v9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </button>
  );
}

export default Button;
