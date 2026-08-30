import React from "react";
import { gsap } from "gsap";

import classNames from "classnames/bind";
import styles from "./FlowingMenu.module.scss";

const cx = classNames.bind(styles);

function FlowingMenu({
  number = "",
  title = "",
  description = "",
  image = null,
  link = "#",
}) {
  const itemRef = React.useRef(null);
  const marqueeRef = React.useRef(null);
  const marqueeInnerRef = React.useRef(null);

  const animationDefaults = {
    duration: 0.6,
    ease: "expo.out",
  };

  const distMetric = (x, y, x2, y2) => {
    const xd = x - x2;
    const yd = y - y2;

    return xd * xd + yd * yd;
  };

  const findClosestEdge = (mouseX, mouseY, width, height) => {
    const top = distMetric(mouseX, mouseY, width / 2, 0);
    const bottom = distMetric(mouseX, mouseY, width / 2, height);

    return top < bottom ? "top" : "bottom";
  };

  const startAnim = (edge) => {
    if (!marqueeRef.current || !marqueeInnerRef.current) {
      return;
    }

    gsap.killTweensOf([marqueeRef.current, marqueeInnerRef.current]);

    gsap
      .timeline({
        defaults: animationDefaults,
      })
      .set(marqueeRef.current, {
        y: edge === "top" ? "-101%" : "101%",
      })
      .set(marqueeInnerRef.current, {
        y: edge === "top" ? "101%" : "-101%",
      })
      .to([marqueeRef.current, marqueeInnerRef.current], {
        y: "0%",
      });
  };

  const hideAnim = (edge) => {
    if (!marqueeRef.current || !marqueeInnerRef.current) {
      return;
    }

    gsap.killTweensOf([marqueeRef.current, marqueeInnerRef.current]);

    gsap
      .timeline({
        defaults: animationDefaults,
      })
      .to(
        marqueeRef.current,
        {
          y: edge === "top" ? "-101%" : "101%",
        },
        0,
      )
      .to(
        marqueeInnerRef.current,
        {
          y: edge === "top" ? "101%" : "-101%",
        },
        0,
      );
  };

  const handleMouseEnter = (event) => {
    if (!itemRef.current) {
      return;
    }

    const rect = itemRef.current.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    startAnim(findClosestEdge(x, y, rect.width, rect.height));
  };

  const handleMouseLeave = (event) => {
    if (!itemRef.current) {
      return;
    }

    const rect = itemRef.current.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    hideAnim(findClosestEdge(x, y, rect.width, rect.height));
  };

  const repeatedMarqueeContent = Array.from({
    length: 4,
  }).map((_, index) => (
    <React.Fragment key={index}>
      <span>{title}</span>

      {image && (
        <div
          className={cx("marquee__img")}
          style={{
            backgroundImage: `url(${image})`,
          }}
          aria-hidden="true"
        />
      )}
    </React.Fragment>
  ));

  return (
    <div
      ref={itemRef}
      className={cx("menu__item")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={link}
        className={cx("menu__item-link")}
        aria-label={`${title}: ${description}`}
      >
        <span className={cx("number")}>{number}</span>

        <span className={cx("link-title")}>{title}</span>

        <span className={cx("description")}>{description}</span>

        <span className={cx("arrow")} aria-hidden="true">
          ↗
        </span>
      </a>

      <div ref={marqueeRef} className={cx("marquee")} aria-hidden="true">
        <div ref={marqueeInnerRef} className={cx("marquee__inner-wrap")}>
          <div className={cx("marquee__inner")}>{repeatedMarqueeContent}</div>
        </div>
      </div>
    </div>
  );
}

export default FlowingMenu;
