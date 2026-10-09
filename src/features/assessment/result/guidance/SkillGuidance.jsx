import { resultSkillLabels } from "../result-presentation";
import { selectSkillGuidance } from "./skill-guidance";

function approvedEmphasis(paragraph) {
  // Only the four approved German conjunctions support inline emphasis.
  return paragraph.split(/(\*(?:und|aber|weil|deshalb)\*)/g).map((part, index) =>
    /^\*(?:und|aber|weil|deshalb)\*$/.test(part)
      ? <em key={index}>{part.slice(1, -1)}</em> : part);
}

export default function SkillGuidance({ targetLevel, skillDimension, passed }) {
  const guidance = selectSkillGuidance({ targetLevel, skillDimension, passed, locale: "vi" });
  if (!guidance) return null;

  const paragraphs = guidance.content.split("\n\n");
  return (
    <section lang="vi" aria-label={`Gợi ý học tập kỹ năng ${resultSkillLabels[skillDimension]}`}>
      <h4>Gợi ý học tập</h4>
      {paragraphs.map((paragraph, index) => <p key={index}>{approvedEmphasis(paragraph)}</p>)}
    </section>
  );
}
