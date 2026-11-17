import { useMemo } from "react";
import ResourceState from "@/shared/ui/state/ResourceState";
import { usePublishedArticles } from "@/features/content/article/hooks/usePublishedArticles";

import { ContentHero } from "./components/ContentHero";
import { ContentSidebar } from "./components/ContentSidebar";
import { FeaturedArticle } from "./components/FeaturedArticle";
import { TopicNavigation } from "./components/TopicNavigation";
import { ContentSection } from "./components/ContentSection";
import { groupPublishedArticles } from "./publishedSections";

import styles from "./ContentPage.module.scss";

const PAGE_SIZE = 20;

function ContentPage() {
  const { articles, totalElements, loading, error, refetch } = usePublishedArticles({
    page: 0,
    size: PAGE_SIZE,
  });

  const sections = useMemo(() => groupPublishedArticles(articles), [articles]);
  const featuredArticle = articles[0] ?? null;

  return (
    <div className={styles.page}>
      <ContentSidebar
        sections={!loading && !error ? sections : []}
        hasFeatured={!loading && !error && Boolean(featuredArticle)}
      />

      <div className={styles.content}>
        <main className={styles.main}>
          <div id="overview">
            <ContentHero />
          </div>

          <section aria-label="Bài viết đã xuất bản">
            <ResourceState
              loading={loading}
              error={error}
              errorProps={{ onRetry: refetch }}
              empty={!loading && articles.length === 0}
              emptyProps={{
                title: <span lang="vi">Chưa có bài viết được xuất bản</span>,
                description: <span lang="vi">Hãy quay lại khi DeutschHub có nội dung mới.</span>,
              }}
            >
              {sections.length > 0 && (
                <>
                  <div id="explore">
                    <TopicNavigation sections={sections} />
                  </div>

                  {featuredArticle && (
                    <div id="featured">
                      <FeaturedArticle article={featuredArticle} />
                    </div>
                  )}

                  <ContentSection sections={sections} />

                  {totalElements > articles.length && (
                    <p role="status" lang="vi">
                      Đang hiển thị {articles.length} / {totalElements} bài viết được xuất bản.
                      Các danh mục bên trên chỉ phản ánh những bài đang hiển thị.
                    </p>
                  )}
                </>
              )}
            </ResourceState>
          </section>
        </main>
      </div>
    </div>
  );
}

export default ContentPage;
