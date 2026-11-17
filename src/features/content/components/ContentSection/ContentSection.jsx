import { ArticlePreview } from "../ArticlePreview";

import classNames from "classnames/bind";
import styles from "./ContentSection.module.scss";

const cx = classNames.bind(styles);

function ContentSection({ sections = [] }) {
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
          <article id={`category-${section.id}`} key={section.id} className={cx("category")}>
            <div className={cx("category-intro")}>
              <span className={cx("number")}>{section.number}</span>

              <h3 className={cx("category-title")}>{section.name}</h3>

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
