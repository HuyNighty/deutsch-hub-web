import TextItem from "../lesson-items/TextItem";
import VideoItem from "../lesson-items/VideoItem";
import PdfItem from "../lesson-items/PdfItem";

export default function LessonItemRenderer({ items }) {
  return (
    <>
      {items.map((item) => {
        switch (item.type) {
          case "TEXT":
            return <TextItem key={item.id} item={item} />;

          case "VIDEO":
            return <VideoItem key={item.id} item={item} />;

          case "PDF":
            return <PdfItem key={item.id} item={item} />;

          default:
            return (
              <div key={item.id}>Unsupported lesson item: {item.type}</div>
            );
        }
      })}
    </>
  );
}
