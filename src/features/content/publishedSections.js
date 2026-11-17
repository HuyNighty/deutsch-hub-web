// Derive navigation from the same published API page rendered below.
// Never substitute hard-coded editorial fixtures or promise unreturned categories.
export function groupPublishedArticles(articles = []) {
  const byCategory = new Map();
  const seenArticles = new Set();

  for (const article of articles) {
    if (!article?.articleId || !article?.slug || seenArticles.has(article.articleId)) {
      continue;
    }
    seenArticles.add(article.articleId);

    const categoryId = article.primaryCategory?.id ?? "uncategorized";
    const key = String(categoryId);
    if (!byCategory.has(key)) {
      byCategory.set(key, {
        id: key,
        name: article.primaryCategory?.name || "Bài viết khác",
        articles: [],
      });
    }
    byCategory.get(key).articles.push(article);
  }

  return Array.from(byCategory.values(), (group, index) => ({
    ...group,
    number: String(index + 1).padStart(2, "0"),
  }));
}
