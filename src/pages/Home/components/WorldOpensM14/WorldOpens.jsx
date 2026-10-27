import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { AppLink } from "@/shared/ui/components/app-link";
import styles from "./WorldOpens.module.scss";

const BACKGROUND_IMAGE = "public/images/background1.jpg";
const BACKGROUND_POSITION = "center 48%";
const OPENING_BACKGROUND_IMAGE = "/images/background2.jpg";
const OPENING_BACKGROUND_POSITION = "center center";
const USE_GLASS_PANEL = false;

const viewportQuery = "(min-width: 1021px) and (min-height: 700px)";

export function WorldOpens({ enabled = true }) {
  const sceneRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [wideEnough, setWideEnough] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(viewportQuery).matches,
  );
  const [progressPercent, setProgressPercent] = useState(0);
  const [bridgeInteractive, setBridgeInteractive] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(viewportQuery);
    const update = () => setWideEnough(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const active = enabled && !prefersReducedMotion && wideEnough;
  const reason = !enabled
    ? "home-toggle-off"
    : prefersReducedMotion
      ? "reduced-motion"
      : !wideEnough
        ? "small-viewport"
        : "active";

  // Measure only the UNTRANSFORMED track. The track is 260svh on desktop.
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start start", "end end"],
  });

  // PRESENT -> DISSOLVE -> FULL-BLEED BACKGROUND -> BRIDGE TEXT
  const forestOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.75, 1],
    [0, 0, 1, 1],
  );
  const oldCopyOpacity = useTransform(
    scrollYProgress,
    [0, 0.38, 0.68, 1],
    [1, 1, 0, 0],
  );
  const oldCopyY = useTransform(scrollYProgress, [0, 0.7, 1], [0, -34, -34]);
  const oldImagesOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.7, 1],
    [1, 1, 0, 0],
  );
  const cityX = useTransform(scrollYProgress, [0, 0.39, 0.72], [0, 0, -130]);
  const cityY = useTransform(scrollYProgress, [0, 0.72], [0, -58]);
  const natureX = useTransform(scrollYProgress, [0, 0.39, 0.72], [0, 0, 130]);
  const natureY = useTransform(scrollYProgress, [0, 0.72], [0, 48]);

  // A real full-viewport photographic background, not another photo card.
  const backgroundOpacity = useTransform(
    scrollYProgress,
    [0, 0.49, 0.8, 1],
    [0, 0, 1, 1],
  );
  const backgroundScale = useTransform(scrollYProgress, [0.49, 1], [1.09, 1]);
  const backgroundY = useTransform(scrollYProgress, [0.49, 1], [24, 0]);

  // Title and CTA rise within the SAME sticky scene while the photo arrives.
  const bridgeOpacity = useTransform(
    scrollYProgress,
    [0, 0.58, 0.86, 1],
    [0, 0, 1, 1],
  );
  const bridgeY = useTransform(scrollYProgress, [0.58, 0.89], [72, 0]);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const interactive = value >= 0.78;
    setBridgeInteractive((previous) =>
      previous === interactive ? previous : interactive,
    );
    if (import.meta.env.DEV) {
      const rounded = Math.max(0, Math.min(100, Math.round(value * 20) * 5));
      setProgressPercent((previous) =>
        previous === rounded ? previous : rounded,
      );
    }
  });

  return (
    <section
      id="home-discovery"
      className={styles.chapter}
      aria-label="Từ những góc nhìn mới đến các lối đi tại DeutschHub"
      data-world-opens
      data-motion-enabled={active ? "true" : "false"}
      data-motion-reason={reason}
      data-motion-progress={progressPercent}
    >
      <motion.div
        className={styles.forestWash}
        style={{ opacity: active ? forestOpacity : 0 }}
        aria-hidden="true"
      />

      <div className={styles.scrollScene} ref={sceneRef}>
        <div className={styles.stickyViewport}>
          {/* First view: existing Berlin / nature story remains intact. */}
          <motion.div
            className={styles.openingBackground}
            style={{
              backgroundImage: `url("${OPENING_BACKGROUND_IMAGE}")`,
              backgroundPosition: OPENING_BACKGROUND_POSITION,
              opacity: active ? oldImagesOpacity : 1,
            }}
            aria-hidden="true"
          />
          <div className={styles.sceneInner}>
            <motion.div
              className={styles.storyCopy}
              style={{
                opacity: active ? oldCopyOpacity : 1,
                y: active ? oldCopyY : 0,
              }}
              aria-hidden={active && bridgeInteractive}
            >
              <p className={styles.eyebrow}>TỪ NGÔN NGỮ ĐẾN NHỮNG GÓC NHÌN</p>
              <h2 className={styles.storyTitle}>
                Không chỉ học một ngôn ngữ.
                <em>Học cách nhìn thế giới.</em>
              </h2>
              <p className={styles.storyDescription}>
                Một từ mới có thể dẫn đến một câu chuyện. Một câu chuyện có thể
                đưa bạn đến một vùng đất chưa từng biết. Ở DeutschHub, bạn được
                tự chọn nơi bắt đầu.
              </p>
              <p className={styles.footnote} lang="de">
                Entdecken · Erleben · Verstehen
              </p>
            </motion.div>

            <motion.div
              className={styles.oldImageGroup}
              style={{ opacity: active ? oldImagesOpacity : 1 }}
              aria-hidden={active && bridgeInteractive}
            >
              <motion.figure
                className={styles.cityFigure}
                style={{ x: active ? cityX : 0, y: active ? cityY : 0 }}
              >
                <div className={styles.photoFrame}>
                  <img
                    src="/images/germany-hero.jpg"
                    alt="Berlin trong ánh hoàng hôn, một góc nhìn về nước Đức"
                    width="1280"
                    height="720"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.photoIndex} aria-hidden="true">
                    01
                  </span>
                </div>
                <figcaption className={styles.photoCaption} lang="de">
                  STADTBLICK
                </figcaption>
              </motion.figure>

              <motion.figure
                className={styles.natureFigure}
                style={{ x: active ? natureX : 0, y: active ? natureY : 0 }}
              >
                <div className={styles.photoFrame}>
                  <img
                    src="/images/green-german.jpg"
                    alt="Phong cảnh xanh bên dòng suối và những ngôi nhà ở Đức"
                    width="820"
                    height="1050"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.photoIndex} aria-hidden="true">
                    02
                  </span>
                </div>
                <figcaption className={styles.photoCaption} lang="de">
                  NATUR
                </figcaption>
              </motion.figure>
              <div className={styles.annotation} aria-hidden="true">
                <span lang="de">Mehr als eine Sprache.</span>
                <small>Một thế giới được nhìn bằng nhiều góc độ.</small>
              </div>
            </motion.div>
          </div>

          {/* Full-bleed photo fills the sticky viewport; no postcard frame. */}
          <motion.div
            className={styles.fullBleed}
            style={{ opacity: active ? backgroundOpacity : 1 }}
            aria-hidden="true"
          >
            <motion.img
              className={styles.backgroundImage}
              src={BACKGROUND_IMAGE}
              alt=""
              loading="lazy"
              decoding="async"
              style={{
                objectPosition: BACKGROUND_POSITION,
                scale: active ? backgroundScale : 1,
                y: active ? backgroundY : 0,
              }}
            />
            <div className={styles.backgroundOverlay} />
          </motion.div>

          {/* Final editorial headline sits ON the photo, as in the reference. */}
          <motion.div
            className={styles.bridgeLayer}
            style={{
              opacity: active ? bridgeOpacity : 1,
              y: active ? bridgeY : 0,
            }}
            inert={active && !bridgeInteractive}
          >
            <div
              className={`${styles.bridgePanel} ${
                USE_GLASS_PANEL ? styles.glassPanel : ""
              }`}
            >
              <p className={styles.bridgeEyebrow}>
                DEUTSCHHUB · TỪ KHÁM PHÁ ĐẾN LỰA CHỌN
              </p>
              <h2 className={styles.bridgeTitle}>
                Mỗi góc nhìn
                <em>mở ra một lối đi.</em>
              </h2>
              <p className={styles.bridgeDescription}>
                Một lời chào có thể là điểm khởi đầu. Khám phá ngôn ngữ, con
                người và hành trình phù hợp với bạn.
              </p>
              <a className={styles.bridgeAction} href="#home-paths-title">
                Khám phá ba lối vào <span aria-hidden="true">↓</span>
              </a>
            </div>
          </motion.div>

          {/* {import.meta.env.DEV && (
            <div className={styles.motionMeter} aria-live="off">
              <span>
                M1.5 · {active ? "FULLSCREEN STORY" : `STATIC · ${reason}`} ·{" "}
                {progressPercent}%
              </span>
              <div className={styles.motionTrack} aria-hidden="true">
                <motion.div
                  className={styles.motionFill}
                  style={{ scaleX: active ? progressScale : 0 }}
                />
              </div>
            </div>
          )} */}
        </div>
      </div>
    </section>
  );
}
