import { useParams } from "react-router-dom";

export default function Hike() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{slug}</h1>
    </div>
  );
}
