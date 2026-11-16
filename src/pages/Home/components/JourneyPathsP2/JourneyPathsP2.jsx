import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { AppLink } from "@/shared/ui/components/app-link";
import styles from "./JourneyPathsP2.module.scss";

/**
 * Paths P2 — Three Invitations: opening photograph, two paths split,
 * and a third path rising into view. No pin, Lenis or GSAP.
 *
 * CHANGE INTRO PHOTO HERE:
 * Place your licensed image in public/images/home/ and update the path.
 */
const INTRO_IMAGE = "/images/home/paths-p2-ivy-door.webp";
const CULTURE_IMAGE = "/images/green-german.jpg";

// When installed by apply-paths-p2.mjs, this array is replaced with the
// current locally authored discoveries array from JourneyPathsP1.jsx.
const discoveries = [
  {
    number: "01",
    eyebrow: "NGÔN NGỮ",
    title: "Bắt đầu bằng một lời chào.",
    description:
      "Từ những câu đầu tiên đến một nền tảng tiếng Đức vững vàng, học theo nhịp của chính bạn.",
    action: "Học tiếng Đức",
    to: "/learn-german",
    kind: "language",
  },
  {
    number: "02",
    eyebrow: "CON NGƯỜI · VĂN HÓA",
    title: "Đi xa hơn những gì bạn đã biết.",
    description:
      "Một đất nước có nhiều lớp câu chuyện. Khám phá bằng địa điểm, chủ đề và góc nhìn.",
    action: "Vào Living Atlas",
    to: "/explore-germany",
    kind: "culture",
  },
  {
    number: "03",
    eyebrow: "HỌC TẬP · TƯƠNG LAI",
    title: "Biến sự tò mò thành hành trình.",
    description:
      "Tìm hiểu con đường học tập ở Đức với thông tin, trải nghiệm và bước chuẩn bị cụ thể.",
    action: "Tìm hiểu du học Đức",
    to: "/study-in-germany",
    kind: "study",
  },
];

const DESKTOP_QUERY = "(min-width: 1021px) and (min-height: 700px)";

function useWideViewport() {
  const [wide, setWide] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const update = () => setWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return wide;
}

function InvitationCard({ item, active, appear, imageY, imageScale, markY }) {
  const className =
    item.kind === "language"
      ? styles.language
      : item.kind === "culture"
        ? styles.culture
        : styles.study;

  return (
    <motion.article
      className={`${styles.card} ${className}`}
      style={{
        x: active ? appear.x : 0,
        y: active ? appear.y : 0,
        scale: active ? appear.scale : 1,
        opacity: active ? appear.opacity : 1,
      }}
    >
      {item.kind === "culture" && (
        <div className={styles.photoSurface} aria-hidden="true">
          <motion.img
            className={styles.photo}
            src={CULTURE_IMAGE}
            alt=""
            width="820"
            height="1050"
            loading="lazy"
            decoding="async"
            style={{
              y: active ? imageY : 0,
              scale: active ? imageScale : 1,
            }}
          />
          <div className={styles.photoShade} />
        </div>
      )}

      <div className={styles.cardTop}>
        <span>{item.number}</span>
        <span>{item.eyebrow}</span>
      </div>

      {item.kind === "language" && (
        <div className={styles.languageArt} aria-hidden="true" lang="de">
          <span>Hallo,</span>
          <span>Welt.</span>
        </div>
      )}

      {item.kind === "study" && (
        <motion.div
          className={styles.studyArt}
          aria-hidden="true"
          style={{ y: active ? markY : 0 }}
        >
          <span>DE</span>
          <span className={styles.studyArrow}>↗</span>
        </motion.div>
      )}

      <div className={styles.cardContent}>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <AppLink to={item.to} variant="default" className={styles.cardLink}>
          {item.action} <span aria-hidden="true">↗</span>
        </AppLink>
      </div>
    </motion.article>
  );
}

export function JourneyPathsP2({ enabled = true }) {
  const headingRef = useRef(null);
  const pairRef = useRef(null);
  const cultureRef = useRef(null);
  const studyRef = useRef(null);

  const reducedMotion = useReducedMotion();
  const wideViewport = useWideViewport();
  const active = enabled && !reducedMotion && wideViewport;

  // Each animation follows its actual viewport entrance. No extra scroll space.
  const { scrollYProgress: headingProgress } = useScroll({
    target: headingRef,
    offset: ["start 92%", "start 28%"],
  });
  const { scrollYProgress: pairProgress } = useScroll({
    target: pairRef,
    offset: ["start 92%", "start 28%"],
  });
  const { scrollYProgress: studyProgress } = useScroll({
    target: studyRef,
    offset: ["start 93%", "start 32%"],
  });
  const { scrollYProgress: cultureProgress } = useScroll({
    target: cultureRef,
    offset: ["start end", "end start"],
  });

  // 01 — A quiet opening: heading and a door into the world.
  const headingOpacity = useTransform(headingProgress, [0, 0.62], [0.3, 1]);
  const headingY = useTransform(headingProgress, [0, 0.9], [32, 0]);
  const imageOpacity = useTransform(headingProgress, [0.08, 0.78], [0.12, 1]);
  const imageX = useTransform(headingProgress, [0, 1], [56, 0]);
  const imageY = useTransform(headingProgress, [0, 1], [58, 0]);
  const imageRotate = useTransform(headingProgress, [0, 1], [3, 0]);
  const lineScale = useTransform(headingProgress, [0.15, 0.94], [0, 1]);

  // 02 — Two invitations separate from the center (left and right).
  // Movement completes while both cards become visible, with no ongoing
  // transform on the links after they settle.
  const leftAppear = {
    x: useTransform(pairProgress, [0, 0.9], [84, -8]),
    y: useTransform(pairProgress, [0, 0.88], [48, 0]),
    scale: useTransform(pairProgress, [0, 0.9], [0.965, 1]),
    opacity: useTransform(pairProgress, [0, 0.54], [0.28, 1]),
  };
  const rightAppear = {
    x: useTransform(pairProgress, [0, 0.9], [-84, 8]),
    y: useTransform(pairProgress, [0, 0.88], [48, 0]),
    scale: useTransform(pairProgress, [0, 0.9], [0.965, 1]),
    opacity: useTransform(pairProgress, [0.06, 0.62], [0.28, 1]),
  };

  // 03 — The future path rises only when its own card enters the viewport.
  const studyAppear = {
    x: 0,
    y: useTransform(studyProgress, [0, 0.94], [112, 0]),
    scale: useTransform(studyProgress, [0, 0.94], [0.958, 1]),
    opacity: useTransform(studyProgress, [0, 0.56], [0.1, 1]),
  };

  const cultureImageY = useTransform(cultureProgress, [0, 1], [-28, 28]);
  const cultureImageScale = useTransform(
    cultureProgress,
    [0, 0.5, 1],
    [1.06, 1.11, 1.06],
  );
  const studyMarkY = useTransform(studyProgress, [0, 1], [50, -12]);
  // Content M2 handoff: card 03 retreats as the card-based stories take over.
  // Applied to the study wrapper, separate from its entry/rise animation.
  const { scrollYProgress: studyHandoffProgress } = useScroll({
    target: studyRef,
    offset: ["end 72%", "end 18%"],
  });
  const studyHandoffScale = useTransform(studyHandoffProgress, [0, 1], [1, 0.9]);
  const studyHandoffY = useTransform(studyHandoffProgress, [0, 1], [0, -62]);
  const studyHandoffOpacity = useTransform(studyHandoffProgress, [0, 0.76, 1], [1, 1, 0.82]);


  const firstTwo = discoveries.filter((item) => item.kind !== "study");
  const study = discoveries.find((item) => item.kind === "study");

  return (
    <section
      id="home-paths"
      className={styles.section}
      data-world-m14-paths
      data-paths-motion={active ? "on" : "off"}
      aria-labelledby="home-paths-title"
    >
      <div className={styles.inner}>
        <div ref={headingRef} className={styles.headingStage}>
          <motion.div
            className={styles.heading}
            style={{
              opacity: active ? headingOpacity : 1,
              y: active ? headingY : 0,
            }}
          >
            <p className={styles.eyebrow}>
              BA LỐI VÀO · KHÔNG CÓ LỘ TRÌNH BẮT BUỘC
            </p>
            <h2 id="home-paths-title">
              Bạn muốn bắt đầu <em>ở đâu?</em>
            </h2>
          </motion.div>

          <div className={styles.introAside}>
            <motion.figure
              className={styles.introFigure}
              style={{
                opacity: active ? imageOpacity : 1,
                x: active ? imageX : 0,
                y: active ? imageY : 0,
                rotate: active ? imageRotate : 0,
              }}
            >
              <div className={styles.introPhotoFrame}>
                <img
                  src={INTRO_IMAGE}
                  alt="Cánh cửa cũ giữa bức tường đá phủ dây leo và những bậc thềm"
                  width="736"
                  height="1308"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className={styles.introCaption}>
                <span lang="de">Ein Anfang.</span>
                <span>Mọi hành trình đều có một cánh cửa đầu tiên.</span>
              </figcaption>
            </motion.figure>
            <p className={styles.headingDescription}>
              Học tiếng Đức, khám phá đời sống, hay chuẩn bị cho hành trình học
              tập — mỗi hướng đều có thể là điểm khởi đầu.
            </p>
          </div>

          <motion.div
            className={styles.headingRule}
            style={{ scaleX: active ? lineScale : 1 }}
            aria-hidden="true"
          />
        </div>

        <div ref={pairRef} className={styles.pair}>
          {firstTwo.map((item, index) => (
            <div
              key={item.kind}
              ref={item.kind === "culture" ? cultureRef : undefined}
              className={styles.cardCell}
            >
              <InvitationCard
                item={item}
                active={active}
                appear={index === 0 ? leftAppear : rightAppear}
                imageY={cultureImageY}
                imageScale={cultureImageScale}
                markY={studyMarkY}
              />
            </div>
          ))}
        </div>

        {study && (
          <div ref={studyRef} className={styles.studyCell}>
            <motion.div
              data-study-handoff
              style={{
                scale: active ? studyHandoffScale : 1,
                y: active ? studyHandoffY : 0,
                opacity: active ? studyHandoffOpacity : 1,
                transformOrigin: "center 42%",
              }}
            >
            <InvitationCard
              item={study}
              active={active}
              appear={studyAppear}
              imageY={cultureImageY}
              imageScale={cultureImageScale}
              markY={studyMarkY}
            />
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
