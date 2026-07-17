export default function PdfItem({ item }) {
  return (
    <div>
      <h3>{item.title}</h3>

      <p>{item.description}</p>

      <a href={item.resourceUrl} target="_blank" rel="noopener noreferrer">
        Open PDF
      </a>
    </div>
  );
}
