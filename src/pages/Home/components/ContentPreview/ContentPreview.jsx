import { AppLink } from "@/shared/ui/components/app-link";

import classNames from "classnames/bind";
import styles from "./ContentPreview.module.scss";

const cx = classNames.bind(styles);

const contents = [
  {
    id: 1,
    category: "Germany",
    title: "Discover Germany beyond the language",
    description:
      "Explore places, culture, history, and everyday life in Germany.",
    image:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80",
    to: "/explore-germany",
  },
  {
    id: 2,
    category: "Culture",
    title: "Understand German culture",
    description:
      "Learn about traditions, people, and the ideas that shape Germany.",
    image:
      "https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?auto=format&fit=crop&w=900&q=80",
    to: "/explore-germany",
  },
  {
    id: 3,
    category: "Everyday life",
    title: "Life in Germany",
    description:
      "Useful knowledge for studying, living, and experiencing Germany.",
    image:
      "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=900&q=80",
    to: "/explore-germany",
  },
];

export default function ContentPreview() {
  return (
    <section className={cx("section")} aria-labelledby="content-preview-title">
      <div className={cx("header")}>
        <div>
          <span className={cx("eyebrow")}>CONTENT</span>

          <h2 id="content-preview-title" className={cx("title")}>
            Discover Germany.
            <br />
            One story at a time.
          </h2>
        </div>

        <p className={cx("description")}>
          DeutschHub is more than a place to learn German. Explore the country,
          its culture, people, history, and everyday life.
        </p>
      </div>

      <div className={cx("grid")}>
        {contents.map((content) => (
          <article key={content.id} className={cx("card")}>
            <AppLink
              to={content.to}
              variant="default"
              className={cx("image-link")}
            >
              <img
                src={content.image}
                alt={content.title}
                className={cx("image")}
              />
            </AppLink>

            <div className={cx("card-body")}>
              <span className={cx("category")}>{content.category}</span>

              <h3 className={cx("card-title")}>
                <AppLink to={content.to} variant="default">
                  {content.title}
                </AppLink>
              </h3>

              <p className={cx("card-description")}>{content.description}</p>

              <AppLink
                to={content.to}
                variant="default"
                className={cx("read-more")}
              >
                Read more
                <span aria-hidden="true">→</span>
              </AppLink>
            </div>
          </article>
        ))}
      </div>

      <div className={cx("footer")}>
        <AppLink
          to="/explore-germany"
          variant="default"
          className={cx("view-all")}
        >
          Explore all content
          <span aria-hidden="true">→</span>
        </AppLink>
      </div>
    </section>
  );
}
