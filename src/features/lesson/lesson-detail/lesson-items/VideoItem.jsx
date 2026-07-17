export default function VideoItem({ item }) {
  return (
    <div>
      <h3>{item.title}</h3>

      <p>{item.description}</p>

      <video controls width="600">
        <source src={item.resourceUrl} />
      </video>
    </div>
  );
}
