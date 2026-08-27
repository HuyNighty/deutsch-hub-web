import classNames from "classnames/bind";

import { usePublishedArticles } from "./hooks/usePublishedArticles";
import { ArticleCatalogHeader } from "./components/ArticleCatalogHeader";
import { ArticleGrid } from "./components/ArticleGrid";

import ResourceState from "@/shared/ui/state/ResourceState";

import styles from "./ArticleCatalog.module.scss";

const cx = classNames.bind(styles);

export default function ArticleCatalog() {
  const { articles, loading, error, refetch } = usePublishedArticles();

  return (
    <ResourceState
      loading={loading}
      error={error}
      errorProps={{
        onRetry: refetch,
      }}
      empty={articles.length === 0}
      emptyProps={{
        title: "No articles found",
        description: "There are no published articles available at the moment.",
      }}
    >
      <main className={cx("page")}>
        <ArticleCatalogHeader />

        <ArticleGrid articles={articles} />
      </main>
    </ResourceState>
  );
}
