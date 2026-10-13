import PublicHome from "./contexts/PublicHome";
import ExploreGermany from "./contexts/ExploreGermany";
import MyLearning from "./contexts/MyLearning";
import Assessment from "./contexts/Assessment";
import { fixtures } from "./fixtures";
import { surfaces, foregrounds } from "./surfaces";
import styles from "./research.module.css";

const renderers = { publicHome: PublicHome, exploreGermany: ExploreGermany, myLearning: MyLearning, assessment: Assessment };

export default function Specimen({ contextId, model }) {
  const Context = renderers[contextId];
  const surface = surfaces[contextId];
  return (
    <main className={styles.canvas} data-testid="specimen" style={{
      "--research-canvas": surface.canvas,
      "--research-reading-fill": surface[model],
      "--research-foreground": foregrounds.deepForest,
      "--research-secondary": foregrounds.forest,
    }}>
      <article className={styles.readingPanel} data-testid="reading-panel" aria-labelledby="specimen-heading">
        <Context fixture={fixtures[contextId]} />
      </article>
    </main>
  );
}
