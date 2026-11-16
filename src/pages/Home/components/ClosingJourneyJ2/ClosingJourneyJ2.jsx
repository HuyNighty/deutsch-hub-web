import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { AppLink } from "@/shared/ui/components/app-link";
import styles from "./ClosingJourneyJ2.module.scss";

/**
 * Closing J2.5 — Soft Dissolve.
 * One scroll track, one pinned viewport, one full-screen landscape photo.
 * Blue landscape crossfades ACROSS THE ENTIRE frame over Forest Green; no hard horizontal wipe.
 *
 * Replace the background with your own licensed landscape image:
 *   public/images/color/blue.jpg  ->  /images/color/blue.jpg
 */
const BACKGROUND_IMAGE = "/images/view/mountain.jpg";
const BACKGROUND_POSITION = "center 50%";

// Replace postcard images here. Keep paths rooted at /images/ (Vite public/).
const PHOTOS = [
  {
    src: "/images/view/mountain2.jpg",
    caption: "Cảnh quan hùng vĩ",
    width: 800,
    height: 1400,
  },
  {
    src: "/images/view/mountain3.jpg",
    caption: "Những góc nhìn mới",
    width: 540,
    height: 960,
  },
  {
    src: "/images/home/closing-garden.webp",
    caption: "Những câu chuyện đang chờ",
    width: 736,
    height: 1103,
  },
];

const DESKTOP_QUERY = "(min-width: 1021px) and (min-height: 700px)";

function useDesktopViewport() {
  const [desktop, setDesktop] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return desktop;
}

function Postcard({ photo, index, className, style }) {
  return (
    <motion.figure
      className={`${styles.postcard} ${className}`}
      style={style}
      aria-hidden="true"
    >
      <div className={styles.photoFrame}>
        <img
          src={photo.src}
          alt=""
          width={photo.width}
          height={photo.height}
          loading="lazy"
          decoding="async"
        />
      </div>
      <figcaption className={styles.photoCaption}>
        <span>0{index + 1}</span>
        <span>{photo.caption}</span>
      </figcaption>
    </motion.figure>
  );
}

export function ClosingJourneyJ2({ enabled = true, handoff }) {
  const trackRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const desktop = useDesktopViewport();
  const handoffActive = Boolean(handoff?.active);
  const active = enabled && !reducedMotion && desktop && !handoffActive;
  const [actionInteractive, setActionInteractive] = useState(false);

  // Start during entry: do not wait until this section reaches the top.
  // This avoids a full viewport of empty Forest while scrollYProgress is 0.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.95", "end end"],
  });

  // Full-frame photographic dissolve: NO clip-path / horizontal boundary.
  // Starts as a hint of blue and smoothly replaces Forest during entry.
  const blueOpacity = useTransform(scrollYProgress, [0, 0.38], [0.12, 1]);
  const backgroundScale = useTransform(scrollYProgress, [0, 0.7], [1.055, 1]);

  // Headline starts immediately; no empty Forest-green holding scene.
  const titleOpacity = useTransform(scrollYProgress, [0, 0.19], [0.56, 1]);
  const titleY = useTransform(scrollYProgress, [0, 0.22], [18, 0]);

  // Postcards follow the headline in a short sequence.
  const laneX = useTransform(scrollYProgress, [0.08, 0.4], [-170, 0]);
  const laneY = useTransform(scrollYProgress, [0.08, 0.4], [36, 0]);
  const laneRotate = useTransform(scrollYProgress, [0.08, 0.4], [-12, -5]);
  const laneOpacity = useTransform(scrollYProgress, [0, 0.25], [0.18, 1]);

  const windowX = useTransform(scrollYProgress, [0.12, 0.46], [180, 0]);
  const windowY = useTransform(scrollYProgress, [0.12, 0.46], [-22, 0]);
  const windowRotate = useTransform(scrollYProgress, [0.12, 0.46], [12, 5]);
  const windowOpacity = useTransform(scrollYProgress, [0.03, 0.3], [0.12, 1]);

  const gardenX = useTransform(scrollYProgress, [0.21, 0.58], [120, 0]);
  const gardenY = useTransform(scrollYProgress, [0.21, 0.58], [120, 0]);
  const gardenRotate = useTransform(scrollYProgress, [0.21, 0.58], [-7, 4]);
  const gardenOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);

  const actionOpacity = useTransform(scrollYProgress, [0.13, 0.35], [0.1, 1]);
  const actionY = useTransform(scrollYProgress, [0.13, 0.35], [14, 0]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const shouldInteract = value >= 0.35;
    setActionInteractive((previous) =>
      previous === shouldInteract ? previous : shouldInteract,
    );
  });

  return (
    <section
      id="home-closing"
      className={styles.section}
      aria-labelledby="home-closing-title"
      data-closing-motion={active || handoffActive ? "on" : "off"}
      data-handoff={handoffActive ? "on" : "off"}
    >
      <div ref={trackRef} className={styles.scrollTrack}>
        <div className={styles.stickyViewport}>
          {/* A SINGLE photo+overlay layer is revealed from bottom to top. */}
          <motion.div
            className={styles.blueScene}
            style={{
              opacity: handoffActive
                ? handoff.blueOpacity
                : active
                  ? blueOpacity
                  : 1,
            }}
            aria-hidden="true"
          >
            <motion.div
              className={styles.backgroundPhoto}
              style={{
                backgroundImage: `url("${BACKGROUND_IMAGE}")`,
                backgroundPosition: BACKGROUND_POSITION,
                scale: handoffActive
                  ? handoff.blueScale
                  : active
                    ? backgroundScale
                    : 1,
              }}
            />
            <div className={styles.blueTint} />
          </motion.div>

          <div className={styles.scene}>
            <div className={styles.gallery}>
              <Postcard
                photo={PHOTOS[0]}
                index={0}
                className={styles.lane}
                style={{
                  x: handoffActive ? handoff.postcard01X : active ? laneX : 0,
                  y: handoffActive ? 0 : active ? laneY : 0,
                  rotate: active ? laneRotate : -5,
                  opacity: handoffActive
                    ? handoff.postcard01Opacity
                    : active
                      ? laneOpacity
                      : 1,
                }}
              />
              <Postcard
                photo={PHOTOS[1]}
                index={1}
                className={styles.window}
                style={{
                  x: handoffActive ? handoff.postcard02X : active ? windowX : 0,
                  y: handoffActive ? 0 : active ? windowY : 0,
                  rotate: active ? windowRotate : 5,
                  opacity: handoffActive
                    ? handoff.postcard02Opacity
                    : active
                      ? windowOpacity
                      : 1,
                }}
              />
              <Postcard
                photo={PHOTOS[2]}
                index={2}
                className={styles.garden}
                style={{
                  x: handoffActive ? handoff.postcard03X : active ? gardenX : 0,
                  y: handoffActive ? 0 : active ? gardenY : 0,
                  rotate: active ? gardenRotate : 4,
                  opacity: handoffActive
                    ? handoff.postcard03Opacity
                    : active
                      ? gardenOpacity
                      : 1,
                }}
              />
            </div>

            <motion.div
              className={styles.copy}
              style={{
                opacity: handoffActive
                  ? handoff.titleOpacity
                  : active
                    ? titleOpacity
                    : 1,
                y: handoffActive ? handoff.titleY : active ? titleY : 0,
              }}
            >
              <p className={styles.eyebrow}>DEUTSCHHUB · THE QUIET UNFOLDING</p>
              <h2 id="home-closing-title" className={styles.title}>
                Thế giới còn nhiều
                <em>điều để khám phá.</em>
              </h2>
              <p className={styles.description}>
                Có những câu chuyện chỉ bắt đầu khi ta chọn bước thêm một bước.
              </p>
              <motion.div
                className={styles.actionRow}
                style={{
                  opacity: handoffActive
                    ? handoff.actionOpacity
                    : active
                      ? actionOpacity
                      : 1,
                  y: handoffActive ? 0 : active ? actionY : 0,
                }}
                inert={
                  handoffActive
                    ? !handoff.actionInteractive
                    : active && !actionInteractive
                }
              >
                <AppLink
                  to="/explore-germany"
                  variant="primary"
                  className={styles.action}
                >
                  Mở một câu chuyện mới
                  <span className={styles.actionArrow} aria-hidden="true">
                    ↗
                  </span>
                </AppLink>
              </motion.div>
            </motion.div>

            <motion.span
              className={styles.chapterMark}
              aria-hidden="true"
              style={{ opacity: handoffActive ? handoff.titleOpacity : 1 }}
            >
              ENDE? · ANFANG.
            </motion.span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Compatibility with a Home/index.jsx that still imports the old named symbol.
// Prefer switching Home to ClosingJourneyJ2 when integration is reviewed.
export { ClosingJourneyJ2 as ClosingJourneyJ1 };
export default ClosingJourneyJ2;
