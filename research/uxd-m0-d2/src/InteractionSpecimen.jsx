import { surfaces, foregrounds } from "./surfaces";
import base from "./research.module.css";

export default function InteractionSpecimen({ contextId, model, children }) {
  const surface = surfaces[contextId];
  return (
    <main className={base.canvas} data-testid="interaction-specimen" style={{
      "--research-canvas": surface.canvas,
      "--research-reading-fill": surface[model],
      "--research-foreground": foregrounds.deepForest,
      "--research-secondary": foregrounds.forest,
    }}>
      <article className={base.readingPanel} data-testid="interaction-panel" aria-labelledby="interaction-heading">
        {children}
      </article>
    </main>
  );
}
