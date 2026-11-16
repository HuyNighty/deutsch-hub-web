import { useMemo, useState } from "react";
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
  const { courses, loading, error, refetch } = useCourses();
  const { theme } = useCatalogueTheme();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState("default");

  const visibleCourses = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    const filtered = courses.filter((course) => {
      const matchesLevel = level === "all" || course.level === level;
      const fields = [course.title, course.description, course.level].filter(Boolean);
      return matchesLevel && (!keyword || fields.join(" ").toLocaleLowerCase("vi").includes(keyword));
    });
    if (sort === "title") return [...filtered].sort((a, b) => a.title.localeCompare(b.title, "vi"));
    return filtered; // Preserve backend order by default.
  }, [courses, search, level, sort]);

  const resetFilters = () => { setSearch(""); setLevel("all"); setSort("default"); };

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
            {!loading && !error && <p role="status">{visibleCourses.length} khóa học</p>}
          </div>

          <ResourceState
            loading={loading}
            error={error}
            empty={courses.length === 0}
            emptyProps={{title: <span lang="vi">Không tìm thấy khóa học</span>,
              description: <span lang="vi">Hiện chưa có khóa học nào.</span>}}
            errorProps={{ onRetry: refetch }}
          >
            {visibleCourses.length > 0 ? <CourseGrid courses={visibleCourses} /> : (
              <div className={cx("filteredEmpty")}>
                <h3>Không có khóa học phù hợp</h3>
                <p>Thử một từ khóa hoặc trình độ khác.</p>
                <button type="button" onClick={resetFilters}>Xóa bộ lọc</button>
              </div>
            )}
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
