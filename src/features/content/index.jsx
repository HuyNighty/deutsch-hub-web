import { usePublishedArticles } from "@/features/content/article/hooks/usePublishedArticles";

import { ContentHero } from "./components/ContentHero";
import { ContentSidebar } from "./components/ContentSidebar";
import { FeaturedArticle } from "./components/FeaturedArticle";
import { TopicNavigation } from "./components/TopicNavigation";
import { ContentSection } from "./components/ContentSection";

import styles from "./ContentPage.module.scss";
import { contentSections } from "./components/ContentSection/contentSection.mock";
import { Newsletter } from "./components/Newsletter";

function ContentPage() {
  const { articles, loading, error } = usePublishedArticles();

  const featuredArticle = articles[0] ?? null;

  return (
    <div className={styles.page}>
      <ContentSidebar />

      <div className={styles.content}>
        <main className={styles.main}>
          <ContentHero />

          <TopicNavigation />

          <FeaturedArticle article={featuredArticle} />

          <ContentSection sections={contentSections} />

          <Newsletter />
        </main>
      </div>
    </div>
  );
}

export default ContentPage;
