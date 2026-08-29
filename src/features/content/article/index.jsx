import { useState } from "react";
import classNames from "classnames/bind";

import { usePublishedArticles } from "./hooks/usePublishedArticles";
import { ArticleCatalogHeader } from "./components/ArticleCatalogHeader";
import { ArticleCatalogFilters } from "./components/ArticleCatalogFilters";
import { ArticleGrid } from "./components/ArticleGrid";

import { useActiveCategories } from "@/features/content/category/hooks/useActiveCategories";
import { useActiveTopicsByCategoryId } from "@/features/content/topic/hooks/useActiveTopicsByCategoryId";

import ResourceState from "@/shared/ui/state/ResourceState";

import styles from "./ArticleCatalog.module.scss";

const cx = classNames.bind(styles);

export default function ArticleCatalog() {
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [topicId, setTopicId] = useState("");

  const { categories } = useActiveCategories();

  const { topics } = useActiveTopicsByCategoryId(categoryId);

  const { articles, totalElements, loading, error, refetch } =
    usePublishedArticles({
      page: 0,
      size: 20,
      keyword: keyword.trim() || undefined,
      categoryId: categoryId || undefined,
      topicId: topicId || undefined,
    });

  function handleCategoryChange(value) {
    setCategoryId(value);

    // Category thay đổi thì topic cũ không còn hợp lệ.
    setTopicId("");
  }

  function handleReset() {
    setKeyword("");
    setCategoryId("");
    setTopicId("");
  }

  return (
    <main className={cx("page")}>
      <ArticleCatalogHeader />

      <ArticleCatalogFilters
        keyword={keyword}
        onKeywordChange={setKeyword}
        categoryId={categoryId}
        onCategoryChange={handleCategoryChange}
        topicId={topicId}
        onTopicChange={setTopicId}
        categories={categories}
        topics={topics}
        onReset={handleReset}
      />

      <div className={cx("results")}>
        <ResourceState
          loading={loading}
          error={error}
          errorProps={{
            onRetry: refetch,
          }}
          empty={!loading && articles.length === 0}
          emptyProps={{
            title: "No articles found",
            description: "Try changing your search or adjusting the filters.",
          }}
        >
          <ArticleGrid articles={articles} />
        </ResourceState>
      </div>

      {!loading && totalElements > 0 && (
        <div className={cx("result-count")}>
          Showing {articles.length} of {totalElements} articles
        </div>
      )}
    </main>
  );
}
