import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

import classNames from "classnames/bind";
import styles from "./ArticleCatalogFilters.module.scss";

const cx = classNames.bind(styles);

export default function ArticleCatalogFilters({
  keyword,
  onKeywordChange,
  categoryId,
  onCategoryChange,
  topicId,
  onTopicChange,
  categories = [],
  topics = [],
  onReset,
}) {
  return (
    <section className={cx("filters")} aria-label="Article filters">
      <div className={cx("search")}>
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className={cx("search-icon")}
          aria-hidden="true"
        />

        <input
          type="search"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="Search articles..."
          aria-label="Search articles"
        />
      </div>

      <div className={cx("controls")}>
        <select
          value={categoryId}
          onChange={(event) => onCategoryChange(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={topicId}
          onChange={(event) => onTopicChange(event.target.value)}
          disabled={!categoryId}
          aria-label="Filter by topic"
        >
          <option value="">
            {categoryId ? "All topics" : "Select a category first"}
          </option>

          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>

        <button type="button" className={cx("reset")} onClick={onReset}>
          <FontAwesomeIcon icon={faRotateLeft} />
          <span>Reset</span>
        </button>
      </div>
    </section>
  );
}
