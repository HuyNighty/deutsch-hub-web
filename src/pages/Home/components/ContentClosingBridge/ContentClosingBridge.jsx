import { useCallback, useEffect, useRef, useState } from "react";
import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import ContentPreviewM2 from "../ContentPreviewM2/ContentPreviewM2";
import { ClosingJourneyJ2 } from "../ClosingJourneyJ2/ClosingJourneyJ2";
import styles from "./ContentClosingBridge.module.scss";

/**
 * D1-P1: the two REAL chapters share one scroll timeline and one viewport.
 * Neither editorial text nor card is duplicated in an overlay/portal.
 *
 * Restrict the first pinned prototype to a comfortably sized editorial layout.
 * Two/three articles, loading, error, mobile and reduced motion use normal flow;
 * no article is discarded, and no inner scroll container is introduced.
 */
const DESKTOP_QUERY = "(min-width: 1021px) and (min-height: 700px)";

function useDesktopViewport() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
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

export default function ContentClosingBridge({ enabled = true }) {
  const trackRef = useRef(null);
  const desktop = useDesktopViewport();
  const reducedMotion = useReducedMotion();
  const [dataState, setDataState] = useState({ count: 0, loading: true, error: false });
  const [interactive, setInteractive] = useState({ content: true, closing: false });

  const onDataState = useCallback((next) => {
    setDataState((previous) =>
      previous.count === next.count &&
      previous.loading === next.loading &&
      previous.error === next.error
        ? previous
        : next,
    );
  }, []);

  const pinned =
    enabled && desktop && !reducedMotion &&
    !dataState.loading && !dataState.error && dataState.count === 1;

  // Same measurement architecture as WorldOpens: untransformed 220svh track.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  // Content exits LEFT/RIGHT while the forest photograph fades to the lake.
  const contentOpacity = useTransform(scrollYProgress, [0, 0.25, 0.53, 1], [1, 1, 0, 0]);
  const introX = useTransform(scrollYProgress, [0, 0.21, 0.54, 1], ["0vw", "0vw", "-33vw", "-33vw"]);
  const cardsX = useTransform(scrollYProgress, [0, 0.21, 0.54, 1], ["0vw", "0vw", "33vw", "33vw"]);
  const blueOpacity = useTransform(scrollYProgress, [0, 0.21, 0.60, 1], [0, 0, 1, 1]);
  const blueScale = useTransform(scrollYProgress, [0.21, 0.65], [1.045, 1]);

  // The real Closing title arrives BEFORE postcard 01 -> 02 -> 03.
  const titleOpacity = useTransform(scrollYProgress, [0, 0.36, 0.61, 1], [0, 0, 1, 1]);
  const titleY = useTransform(scrollYProgress, [0.36, 0.61], [38, 0]);
  const actionOpacity = useTransform(scrollYProgress, [0.47, 0.65], [0, 1]);
  const postcard01Opacity = useTransform(scrollYProgress, [0.58, 0.73], [0, 1]);
  const postcard02Opacity = useTransform(scrollYProgress, [0.70, 0.84], [0, 1]);
  const postcard03Opacity = useTransform(scrollYProgress, [0.82, 0.95], [0, 1]);
  const postcard01X = useTransform(scrollYProgress, [0.58, 0.73], [-85, 0]);
  const postcard02X = useTransform(scrollYProgress, [0.70, 0.84], [85, 0]);
  const postcard03X = useTransform(scrollYProgress, [0.82, 0.95], [75, 0]);

  useEffect(() => {
    const progress = scrollYProgress.get();
    setInteractive({
      content: !pinned || progress < 0.50,
      closing: !pinned || progress >= 0.68,
    });
  }, [pinned, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (!pinned) return;
    const content = progress < 0.50;
    const closing = progress >= 0.68;
    setInteractive((previous) =>
      previous.content === content && previous.closing === closing
        ? previous
        : { content, closing },
    );
  });

  const shared = pinned
    ? {
        active: true,
        contentOpacity,
        introX,
        cardsX,
        blueOpacity,
        blueScale,
        titleOpacity,
        titleY,
        actionOpacity,
        actionInteractive: interactive.closing,
        postcard01Opacity,
        postcard02Opacity,
        postcard03Opacity,
        postcard01X,
        postcard02X,
        postcard03X,
      }
    : undefined;

  return (
    <div
      className={styles.bridge}
      data-j25-d1
      data-mode={pinned ? "pinned" : "natural"}
      data-content-count={dataState.count}
      data-motion-reason={
        !enabled ? "disabled" : reducedMotion ? "reduced-motion" :
        !desktop ? "viewport" : dataState.loading ? "loading" :
        dataState.error ? "error" : dataState.count !== 1 ? "article-count" : "active"
      }
    >
      <div ref={trackRef} className={styles.scrollTrack}>
        <div className={styles.stickyViewport}>
          <div
            className={styles.contentLayer}
            inert={pinned && !interactive.content}
            aria-hidden={pinned && !interactive.content}
          >
            <ContentPreviewM2 enabled={enabled} handoff={shared} onDataState={onDataState} />
          </div>
          <div
            className={styles.closingLayer}
            inert={pinned && !interactive.closing}
            aria-hidden={pinned && !interactive.closing}
          >
            <ClosingJourneyJ2 enabled={enabled} handoff={shared} />
          </div>
        </div>
      </div>
    </div>
  );
}
