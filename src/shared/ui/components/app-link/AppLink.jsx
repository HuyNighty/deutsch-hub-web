import { Link as RouterLink } from "react-router-dom";
import classNames from "classnames/bind";

import styles from "./AppLink.module.scss";

const cx = classNames.bind(styles);

const VARIANTS = ["default", "primary", "outline"];
const SIZES = ["sm", "md", "lg"];

function AppLink({
  variant = "default",
  size = "md",
  children,
  className,
  ...props
}) {
  const linkVariant = VARIANTS.includes(variant) ? variant : "default";

  const linkSize = SIZES.includes(size) ? size : "md";

  return (
    <RouterLink
      className={cx("link", linkVariant, linkSize, className)}
      {...props}
    >
      {children}
    </RouterLink>
  );
}

export default AppLink;
