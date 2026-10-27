import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { AppLink } from "@/shared/ui/components/app-link";
import { usePublishedArticles } from "@/features/content/article/hooks/usePublishedArticles";
import useMedia from "@/features/media/hooks/useMedia";
import styles from "./ContentPreviewM2.module.scss";

/**
 * Content M2 — Stories as Cards / Paths-to-Stories handoff.
 * All cards use real published articles and media. No demo content, no extra pin.
 * The photographic imagery belongs INSIDE the cards, not behind the section.
 */
const ease = [0.22, 1, 0.36, 1];
const DESKTOP_QUERY = "(min-width: 1021px) and (min-height: 700px)";

function useWideViewport() {
  const [wide, setWide] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return wide;
}

function StoryCard({ article, index, style }) {
  const { media, isPending } = useMedia(article.coverMediaId);
  const url = `/explore-germany/${article.slug}`;

  return (
    <motion.article className={styles.card} style={style}>
      <div className={styles.cardMedia} aria-hidden="true">
        {isPending || !media?.objectUrl ? (
          <div className={styles.mediaFallback}>
            <span>DeutschHub</span>
          </div>
        ) : (
          <img src={media.objectUrl} alt="" loading="lazy" decoding="async" />
        )}
      </div>
      <div className={styles.cardShade} aria-hidden="true" />

      <div className={styles.cardTop}>
        <span>{String(index + 1).padStart(2, "0")} / STORY</span>
        {article.publishedAt && (
          <time dateTime={article.publishedAt}>
            {new Date(article.publishedAt).toLocaleDateString("en-GB")}
          </time>
        )}
      </div>

      <div className={styles.cardBottom}>
        {article.primaryCategory?.name && (
          <span className={styles.category}>
            {article.primaryCategory.name}
          </span>
        )}
        <h3>
          <AppLink to={url} variant="default" className={styles.titleLink}>
            {article.title}
          </AppLink>
        </h3>
        {article.summary && <p className={styles.summary}>{article.summary}</p>}
        {article.topics?.length > 0 && (
          <div className={styles.topics} aria-label="Chủ đề bài viết">
            {article.topics.slice(0, 2).map((topic) => (
              <span key={topic.id} className={styles.topic}>
                {topic.name}
              </span>
            ))}
          </div>
        )}
        <AppLink
          to={url}
          variant="default"
          className={styles.readAction}
          appearance="action"
        >
          <span>Đọc câu chuyện</span>
          <span className={styles.readArrow} aria-hidden="true">
            ↗
          </span>
        </AppLink>
      </div>
    </motion.article>
  );
}

export default function ContentPreviewM2({ enabled = true, handoff, onDataState }) {
  const entryRef = useRef(null);
  const cardsRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const wideViewport = useWideViewport();
  const handoffActive = Boolean(handoff?.active);
  const active = enabled && !reducedMotion && wideViewport && !handoffActive;

  // A quiet scroll-linked entrance, synchronized naturally with the retreat
  // of the preceding Study card in JourneyPathsP2.
  const { scrollYProgress: entryProgress } = useScroll({
    target: entryRef,
    offset: ["start 92%", "start 36%"],
  });
  const { scrollYProgress: cardsProgress } = useScroll({
    target: cardsRef,
    offset: ["start 94%", "start 27%"],
  });

  const headingOpacity = useTransform(entryProgress, [0, 0.7], [0.25, 1]);
  const headingY = useTransform(entryProgress, [0, 1], [56, 0]);
  const cardsOpacity = useTransform(cardsProgress, [0, 0.63], [0.02, 1]);
  const cardsY = useTransform(cardsProgress, [0, 1], [104, 0]);
  const cardsScale = useTransform(cardsProgress, [0, 1], [0.935, 1]);

  const { articles, loading, error } = usePublishedArticles({
    page: 0,
    size: 3,
  });
  const published = articles.slice(0, 3);

  useEffect(() => {
    onDataState?.({
      count: published.length,
      loading: Boolean(loading),
      error: Boolean(error),
    });
  }, [onDataState, published.length, loading, error]);

  return (
    <section
      id="home-stories"
      className={styles.section}
      aria-labelledby="content-preview-title"
      data-content-motion={active ? "on" : "off"}
      data-handoff={handoffActive ? "on" : "off"}
      data-content-count={published.length}
    >
      <div className={styles.inner}>
        <motion.div
          ref={entryRef}
          className={styles.intro}
          style={{
            opacity: handoffActive ? handoff.contentOpacity : active ? headingOpacity : 1,
            x: handoffActive ? handoff.introX : 0,
            y: handoffActive ? 0 : active ? headingY : 0,
          }}
        >
          <p className={styles.eyebrow}>DEUTSCHHUB · NHỮNG CÂU CHUYỆN</p>

          <h2 id="content-preview-title" className={styles.title}>
            Khám phá nước Đức.
            <em>Qua từng câu chuyện.</em>
          </h2>

          <p className={styles.description}>
            DeutschHub không chỉ là nơi học tiếng Đức. Hãy khám phá đất nước,
            văn hóa, con người, lịch sử và cuộc sống thường ngày qua những câu
            chuyện đầy cảm hứng.
          </p>

          <p className={styles.footnote}>Câu chuyện · Vùng đất · Con người</p>
        </motion.div>

        <motion.div
          ref={cardsRef}
          className={styles.storiesArea}
          style={{
            opacity: handoffActive ? handoff.contentOpacity : 1,
            x: handoffActive ? handoff.cardsX : 0,
          }}
        >
          {loading && (
            <div className={styles.state} role="status">
              Loading content...
            </div>
          )}
          {error && !loading && (
            <div className={styles.state} role="alert">
              Unable to load content.
            </div>
          )}
          {!loading && !error && published.length === 0 && (
            <div className={styles.state}>No published content available.</div>
          )}
          {!loading && !error && published.length > 0 && (
            <div className={styles.cardGrid} data-count={published.length}>
              {published.map((article, index) => (
                <StoryCard
                  key={article.articleId}
                  article={article}
                  index={index}
                  style={{
                    opacity: active ? cardsOpacity : 1,
                    y: active ? cardsY : 0,
                    scale: active ? cardsScale : 1,
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          className={styles.footer}
          style={{
            opacity: handoffActive ? handoff.contentOpacity : 1,
            x: handoffActive ? handoff.cardsX : 0,
          }}
          initial={active ? { opacity: 0, y: 20 } : false}
          whileInView={active ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.65, ease }}
        >
          <AppLink
            to="/explore-germany"
            variant="default"
            className={styles.exploreLink}
          >
            Khám phá tất cả bài viết <span aria-hidden="true">↗</span>
          </AppLink>
        </motion.div>
      </div>
    </section>
  );
}
