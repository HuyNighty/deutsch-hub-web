import { useState } from "react";
import classNames from "classnames/bind";

import { AppLink } from "@/shared/ui/components/app-link";
import { WorldOpens } from "./components/WorldOpensM14/WorldOpens";
import { ImmersiveHero } from "./components/ImmersiveHero/ImmersiveHero";
import { JourneyPathsP2 } from "./components/JourneyPathsP2/JourneyPathsP2";
import ContentClosingBridge from "./components/ContentClosingBridge/ContentClosingBridge";
import styles from "./Home.module.scss";

const cx = classNames.bind(styles);

export default function Home() {
  const [previewMotion, setPreviewMotion] = useState(true);

  return (
    <div className={cx("page")}>
      <ImmersiveHero enabled={previewMotion} />

      <WorldOpens enabled={previewMotion} />

      <JourneyPathsP2 enabled={previewMotion} />

      {/* D1 owns BOTH real chapters in one shared scroll scene. */}
      <div className={cx("stories")}>
        <ContentClosingBridge enabled={previewMotion} />
      </div>

      {/* {import.meta.env.DEV && (
        <div
          className={cx("devMotionControl")}
          aria-label="Công cụ đánh giá chuyển động chỉ hiển thị trong development"
        >
          <span>Home motion</span>
          <button
            type="button"
            aria-pressed={previewMotion}
            onClick={() => setPreviewMotion((value) => !value)}
          >
            {previewMotion ? "On" : "Off"}
          </button>
        </div>
      )} */}
    </div>
  );
}
