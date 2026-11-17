import { useEffect, useMemo, useState } from "react";
import classNames from "classnames/bind";

import ResourceState from "@/shared/ui/state/ResourceState";
import { useCatalogueTheme } from "@/app/providers/CatalogueThemeProvider";
import { CourseGrid } from "./components/CourseGrid";
import { CourseCatalogHeader } from "./components/CourseCatalogHeader";
import { useCourses } from "./hooks/useCourses";
import styles from "./CourseCatalog.module.scss";

const cx = classNames.bind(styles);
const levels = [
  { code: "A1", title: "Bắt đầu với A1", description: "Làm quen và giao tiếp cơ bản" },
  { code: "A2", title: "Tiếp tục A2", description: "Mở rộng vốn từ và tình huống thực tế" },
  { code: "B1", title: "Nâng cao B1", description: "Sử dụng tiếng Đức độc lập, linh hoạt" },
];

export default function CourseCatalog() {
  const { theme } = useCatalogueTheme();
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState("default");

  // Debounce only the server request; don't apply a misleading partial local text search.
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    courses, totalElements, loading, error, refetch,
    fetchNextPage, hasNextPage, fetchingNextPage, nextPageError,
  } = useCourses(keyword);
  const searchPending = keyword !== search.trim();

  const visibleCourses = useMemo(() => {
    const filtered = courses.filter((course) => level === "all" || course.level === level);
    if (sort === "title") return [...filtered].sort((a, b) => a.title.localeCompare(b.title, "vi"));
    return filtered; // Default order is the backend's published-course ordering.
  }, [courses, level, sort]);

  const resetFilters = () => {
    setSearch("");
    setKeyword("");
    setLevel("all");
    setSort("default");
  };

  return (
    <div lang="vi" className={cx("catalog")} data-theme={theme}>
      <div className={cx("layout")}>
        <CourseCatalogHeader level={level} onLevelChange={setLevel} />

        <section className={cx("discovery")} id="catalogue-results" aria-labelledby="catalogue-list-heading">
          <div className={cx("controls")} role="search">
            <label className={cx("search")}>
              <span className={cx("sr-only")}>Tìm khóa học</span>
              <span aria-hidden="true">⌕</span>
              <input type="search" placeholder="Tìm khóa học hoặc chủ đề…" value={search}
                onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label className={cx("select")}>
              <span className={cx("sr-only")}>Trình độ</span>
              <select value={level} onChange={(event) => setLevel(event.target.value)} aria-label="Lọc trình độ">
                <option value="all">Tất cả trình độ</option><option value="A1">A1</option>
                <option value="A2">A2</option><option value="B1">B1</option>
              </select>
            </label>
            <label className={cx("select")}>
              <span className={cx("sr-only")}>Sắp xếp</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sắp xếp khóa học">
                <option value="default">Thứ tự mặc định</option><option value="title">Tên A–Z</option>
              </select>
            </label>
          </div>

          <div className={cx("listHeading")}>
            <h2 id="catalogue-list-heading">Danh sách khóa học</h2>
            {!loading && !error && !searchPending && (
              <p role="status">
                {visibleCourses.length} hiển thị · {courses.length}/{totalElements} khóa học đã tải
              </p>
            )}
          </div>

          <ResourceState
            loading={loading || searchPending}
            error={error}
            empty={courses.length === 0}
            emptyProps={{title: <span lang="vi">Không tìm thấy khóa học</span>,
              description: <span lang="vi">{keyword ? "Không có khóa học phù hợp với từ khóa." : "Hiện chưa có khóa học nào."}</span>}}
            errorProps={{ onRetry: refetch }}
          >
            <>
              {visibleCourses.length > 0 ? <CourseGrid courses={visibleCourses} /> : (
                <div className={cx("filteredEmpty")}>
                  <h3>Chưa thấy khóa học phù hợp trong dữ liệu đã tải</h3>
                  <p>{hasNextPage ? "Bạn có thể tải thêm để tìm ở các trang tiếp theo." : "Thử một từ khóa hoặc trình độ khác."}</p>
                  <button type="button" onClick={resetFilters}>Xóa bộ lọc</button>
                </div>
              )}
              {hasNextPage && (
                <div className={cx("pagination")}>
                  <p className={cx("paginationNote")}>
                    Lọc trình độ và sắp xếp chỉ áp dụng cho các khóa học đã tải.
                  </p>
                  {nextPageError && (
                    <p role="alert" className={cx("paginationError")}>
                      Không tải được trang tiếp theo. Danh sách đã tải vẫn được giữ nguyên.
                    </p>
                  )}
                  <button
                    type="button"
                    className={cx("paginationButton")}
                    onClick={() => void fetchNextPage()}
                    disabled={fetchingNextPage}
                  >
                    {fetchingNextPage ? "Đang tải thêm…" : nextPageError ? "Thử tải lại" : "Tải thêm khóa học"}
                  </button>
                </div>
              )}
            </>
          </ResourceState>
        </section>

        <aside className={cx("roadmap")} aria-labelledby="catalogue-roadmap-heading">
          <h2 id="catalogue-roadmap-heading">Lộ trình học gợi ý</h2>
          <p className={cx("roadmapIntro")}>Gợi ý chung theo CEFR, không phải tiến độ học cá nhân.</p>
          <ol>
            {levels.map((item, index) => (
              <li key={item.code} className={cx("roadmapStep", { active: index === 0 })}>
                <span className={cx("roadmapLevel")} aria-hidden="true">{item.code}</span>
                <div><strong>{item.title}</strong><span>{item.description}</span></div>
              </li>
            ))}
          </ol>
          <a className={cx("roadmapLink")} href="#catalogue-results">Khám phá khóa học <span aria-hidden="true">→</span></a>
        </aside>
      </div>
    </div>
  );
}
