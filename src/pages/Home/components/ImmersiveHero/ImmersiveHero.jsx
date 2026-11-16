import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { AppLink } from "@/shared/ui/components/app-link";
import styles from "./ImmersiveHero.module.scss";

const HERO_BACKGROUND = "/images/german-autumn.jpg";
const HERO_BACKGROUND_POSITION = "center 48%";
const USE_SOFT_GLASS_PANEL = false;

export function ImmersiveHero({ enabled = true }) {
  const heroRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const animate = enabled && !prefersReducedMotion;

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.14]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 65]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -65]);
  const titleOpacity = useTransform(
    scrollYProgress,
    [0, 0.48, 0.88, 1],
    [1, 1, 0.25, 0],
  );
  const imageDarken = useTransform(scrollYProgress, [0, 1], [0, 0.35]);
  const scrollCueOpacity = useTransform(scrollYProgress, [0, 0.62], [1, 0]);

  return (
    <section
      ref={heroRef}
      className={styles.hero}
      data-header-hero
      data-home-stage
      aria-labelledby="home-title"
      data-hero-motion={animate ? "on" : "off"}
    >
      <div className={styles.background} aria-hidden="true">
        <motion.img
          className={styles.backgroundImage}
          src={HERO_BACKGROUND}
          alt=""
          width="1600"
          height="1000"
          fetchPriority="high"
          decoding="async"
          style={{
            objectPosition: HERO_BACKGROUND_POSITION,
            scale: animate ? imageScale : 1,
            y: animate ? imageY : 0,
          }}
        />
        <div className={styles.imageTint} />
        <motion.div
          className={styles.exitTint}
          style={{ opacity: animate ? imageDarken : 0 }}
        />
        <div className={styles.headerLegibility} />
        <div className={styles.bottomBlend} />
      </div>

      <motion.div
        className={styles.arrival}
        style={{
          opacity: animate ? titleOpacity : 1,
          y: animate ? titleY : 0,
        }}
      >
        <div
          className={`${styles.content} ${
            USE_SOFT_GLASS_PANEL ? styles.glassPanel : ""
          }`}
        >
          <motion.p
            className={styles.eyebrow}
            initial={animate ? { opacity: 0, y: 18 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease: "easeOut" }}
          >
            DEUTSCHHUB · NGÔN NGỮ · VĂN HÓA · HÀNH TRÌNH
          </motion.p>

          <motion.h1
            id="home-title"
            className={styles.title}
            initial={animate ? { opacity: 0, y: 24 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.18, ease: "easeOut" }}
          >
            Từ một lời chào,
            <em>đến cả một thế giới.</em>
          </motion.h1>

          <motion.p
            className={styles.description}
            initial={animate ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
          >
            Tiếng Đức mở ra những cuộc trò chuyện. Những câu chuyện mở ra cách
            nhìn mới. DeutschHub là nơi bạn học, khám phá và chọn con đường của
            riêng mình.
          </motion.p>

          <motion.div
            className={styles.actions}
            initial={animate ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.48, ease: "easeOut" }}
          >
            <AppLink
              to="/learn-german"
              variant="default"
              className={styles.primaryAction}
              appearance="action"
            >
              Bắt đầu học tiếng Đức <span aria-hidden="true">↗</span>
            </AppLink>
            <AppLink
              to="/explore-germany"
              variant="outline"
              className={styles.secondaryAction}
              appearance="action"
            >
              Khám phá Living Atlas <span aria-hidden="true">↗</span>
            </AppLink>
          </motion.div>
          <motion.p
            className={styles.studyLink}
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            Đang tìm đường du học?{" "}
            <AppLink to="/study-in-germany" variant="default">
              Tìm hiểu tại đây <span aria-hidden="true">↗</span>
            </AppLink>
          </motion.p>
        </div>
      </motion.div>

      <motion.div
        className={styles.bottomBar}
        style={{ opacity: animate ? scrollCueOpacity : 1 }}
      >
        <a href="#home-discovery" className={styles.scrollCue}>
          <span aria-hidden="true">↓</span> Cuộn để khám phá
        </a>
        <span className={styles.edition}>
          EIN ANFANG · A WORLD THAT GROWS WITH YOU
        </span>
      </motion.div>
    </section>
  );
}
