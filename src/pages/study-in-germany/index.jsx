import { useLayoutEffect } from "react";
import { studyContent } from "@/features/study-in-germany/content/studyContent";
import styles from "./StudyInGermany.module.scss";

function ContentBlocks({ blocks, tableCaption }) {
  return blocks.map((block, index) => {
    if (block.type === "list") {
      return <ul key={index}>{block.items.map(item => <li key={item}>{item}</li>)}</ul>;
    }
    if (block.type === "table") {
      return (
        <div key={index} className={styles.comparison}>
          <p id="comparison-help">Cuộn ngang để đọc đầy đủ bảng so sánh.</p>
          <div className={styles.tableScroll} role="region" aria-label={tableCaption} aria-describedby="comparison-help" tabIndex={0}>
            <table>
              <caption>{tableCaption}</caption>
              <thead><tr>{block.headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead>
              <tbody>{block.rows.map(row => (
                <tr key={row[0]}>
                  <th scope="row">{row[0]}</th>
                  {row.slice(1).map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      );
    }
    return <p key={index}>{block.text}</p>;
  });
}

function UnitLinks({ units }) {
  return <ul>{units.map(unit => <li key={unit.id}><a href={`#${unit.id}`}>{unit.label ?? unit.title}</a></li>)}</ul>;
}

export default function StudyInGermany() {
  const { introduction, units } = studyContent;
  useLayoutEffect(() => {
    // The native URL fragment can arrive before the SPA has mounted its heading.
    // Initialize it once; subsequent anchor clicks and history remain browser-owned.
    const id = window.location.hash.slice(1);
    if (!units.some(unit => unit.id === id)) return;
    const heading = document.getElementById(id);
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "start", behavior: "instant" });
  }, [units]);
  return (
    <div className={styles.page} lang="vi">
      <div className={styles.introduction}>
        <h1>{introduction.title}</h1>
        <ContentBlocks blocks={introduction.blocks} />
        <div className={styles.entrances}>
          <nav aria-label="Khám phá theo con đường học tập">
            <h2>Con đường học tập</h2>
            <UnitLinks units={units.slice(0, 3)} />
          </nav>
          <nav aria-label="Khám phá từ câu hỏi">
            <h2>Bắt đầu từ câu hỏi</h2>
            <UnitLinks units={units.slice(3)} />
          </nav>
        </div>
      </div>
      {units.map(unit => (
        <section key={unit.id} className={styles.unit} aria-labelledby={unit.id}>
          <h2 id={unit.id} tabIndex={-1}>{unit.title}</h2>
          <p className={styles.question}>{unit.readerQuestion}</p>
          <p className={styles.summary}>{unit.summary}</p>
          <ContentBlocks blocks={unit.blocks} tableCaption={unit.readerQuestion} />
          {unit.sections.map(section => (
            <div key={section.heading} className={styles.subsection}>
              <h3>{section.heading}</h3>
              <ContentBlocks blocks={section.blocks} />
            </div>
          ))}
          <nav aria-label={`Khám phá tiếp từ ${unit.title}`} className={styles.subsection}>
            <h3>Khám phá tiếp</h3>
            <UnitLinks units={unit.related} />
          </nav>
          <div className={styles.sources}>
            <h3>Nguồn tham khảo</h3>
            <ul>{unit.sources.map(source => (
              <li key={source.url}>
                <a href={source.url}>{source.title} <span aria-hidden="true">↗</span></a>
              </li>
            ))}</ul>
          </div>
        </section>
      ))}
    </div>
  );
}
