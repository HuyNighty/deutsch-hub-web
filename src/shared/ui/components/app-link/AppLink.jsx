import { Link as RouterLink } from "react-router-dom";

import classNames from "classnames/bind";
import styles from "./AppLink.module.scss";

const cx = classNames.bind(styles);

const VARIANTS = ["default", "primary", "outline", "dark"];
const SIZES = ["sm", "md", "lg"];

/**
 * Links navigate; Button performs actions.
 * appearance="action" opts into the editorial button styling while keeping
 * existing inline/default links unchanged throughout DeutschHub.
 */
function AppLink({
  variant = "default",
  size = "md",
  appearance = "text",
  showArrow = false,
  children,
  className,
  ...props
}) {
  const linkVariant = VARIANTS.includes(variant) ? variant : "default";
  const linkSize = SIZES.includes(size) ? size : "md";
  const action = appearance === "action";

  return (
    <RouterLink
      className={cx("link", linkVariant, linkSize, { action }, className)}
      {...props}
    >
      {children}
      {action && showArrow && (
        <span className={styles.actionArrow} aria-hidden="true">
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
    </RouterLink>
  );
}

export default AppLink;
