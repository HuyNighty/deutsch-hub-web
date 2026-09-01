import { AppLink } from "@/shared/ui/components/app-link";
import { ArticlePreview } from "../ArticlePreview";

import { usePublishedArticles } from "@/features/content/article/hooks/usePublishedArticles";

import classNames from "classnames/bind";
import styles from "./ContentSection.module.scss";

const cx = classNames.bind(styles);

function ContentSection() {
  const { articles, loading, error } = usePublishedArticles({
    page: 0,
    size: 20,
  });

  if (loading || error || !articles.length) {
    return null;
  }

  const sectionsMap = new Map();

  articles.forEach((article) => {
    const category = article.primaryCategory;

    if (!category) {
      return;
    }

    if (!sectionsMap.has(category.id)) {
      sectionsMap.set(category.id, {
        id: category.id,
        name: category.name,
        articles: [],
      });
    }

    sectionsMap.get(category.id).articles.push(article);
  });

  const sections = Array.from(sectionsMap.values()).map((section, index) => ({
    ...section,
    number: String(index + 1).padStart(2, "0"),
  }));

  if (!sections.length) {
    return null;
  }

  return (
    <section className={cx("section")} aria-labelledby="content-sections-title">
      <header className={cx("heading")}>
        <div>
          <span className={cx("eyebrow")}>KHÁM PHÁ TỪNG LĨNH VỰC</span>

          <h2 id="content-sections-title" className={cx("title")}>
            Những câu chuyện đáng để khám phá.
          </h2>
        </div>

        <span className={cx("rule")} aria-hidden="true" />
      </header>

      <div className={cx("sections")}>
        {sections.map((section) => (
          <article key={section.id} className={cx("category")}>
            <div className={cx("category-intro")}>
              <span className={cx("number")}>{section.number}</span>

              <h3 className={cx("category-title")}>{section.name}</h3>

              <AppLink
                to={`/explore-germany/category/${section.id}`}
                variant="default"
                className={cx("category-link")}
              >
                Khám phá
                <span aria-hidden="true">→</span>
              </AppLink>
            </div>

            <div className={cx("articles")}>
              {section.articles.map((article) => (
                <ArticlePreview key={article.articleId} article={article} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ContentSection;
