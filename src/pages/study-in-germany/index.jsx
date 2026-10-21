import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { studyContent } from "@/features/study-in-germany/content/studyContent";
import styles from "./StudyInGermany.module.scss";

function ContentBlocks({ blocks, tableCaption, markGermanTerm = false }) {
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
    return <p key={index}>{markGermanTerm
      ? block.text.split(/(Duales Studium)/).map((part, partIndex) => part === "Duales Studium"
        ? <span key={partIndex} lang="de">{part}</span> : part)
      : block.text}</p>;
  });
}

function UnitLinks({ units, invitation = false }) {
  return <ul>{units.map(unit => <li key={unit.id}><a href={`#${unit.id}`}>
    {unit.label ?? unit.title}
    {invitation && <svg className={styles.invitationArrow} aria-hidden="true" viewBox="0 0 20 20" focusable="false">
      <path d="M4 5h11v11M15 5 4 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>}
  </a></li>)}</ul>;
}

export default function StudyInGermany() {
  const { introduction, units } = studyContent;
  const location = useLocation();
  const navigationType = useNavigationType();
  const introductionHeading = useRef(null);
  const initialHash = useRef(location.hash);

  useLayoutEffect(() => {
    const previousLanguage = document.documentElement.lang;
    const previousTitle = document.title;
    document.documentElement.lang = "vi";
    document.title = `${introduction.title} | DeutschHub`;
    return () => {
      document.documentElement.lang = previousLanguage;
      document.title = previousTitle;
    };
  }, [introduction.title]);

  useLayoutEffect(() => {
    // The native URL fragment can arrive before the SPA has mounted its heading.
    // Initialize it once; subsequent anchor clicks and history remain browser-owned.
    const id = initialHash.current.slice(1);
    if (!units.some(unit => unit.id === id)) return;
    const heading = document.getElementById(id);
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "start", behavior: "instant" });
  }, [units]);

  useLayoutEffect(() => {
    // Only explicit route entries reset the introduction, never native history.
    if (navigationType !== "PUSH" || location.hash) return;
    introductionHeading.current.focus({ preventScroll: true });
    introductionHeading.current.scrollIntoView({ block: "start", behavior: "instant" });
  }, [location.key, location.hash, navigationType]);
  return (
    <div className={styles.page} lang="vi">
      <div className={styles.introduction}>
        <div className={styles.arrival}>
          <h1 ref={introductionHeading} tabIndex={-1}>{introduction.title}</h1>
          <div className={styles.arrivalCopy}>
            <ContentBlocks blocks={introduction.blocks.slice(0, 3)} markGermanTerm />
          </div>
        </div>
        <div className={styles.entrances}>
          <nav className={styles.pathInvitation} aria-label="Khám phá theo con đường học tập">
            <h2>Con đường học tập</h2>
            <UnitLinks units={units.slice(0, 3)} invitation />
          </nav>
          <nav className={styles.questionInvitation} aria-label="Khám phá từ câu hỏi">
            <h2>Bắt đầu từ câu hỏi</h2>
            <UnitLinks units={units.slice(3)} invitation />
          </nav>
        </div>
        <div className={styles.supportingContext}>
          <ContentBlocks blocks={introduction.blocks.slice(3)} />
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
