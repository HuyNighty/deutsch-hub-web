export default function TextItem({ item }) {
  return (
    <div>
      <h3>{item.title}</h3>

      <p>{item.description}</p>

      <div>{item.content}</div>
    </div>
  );
}
