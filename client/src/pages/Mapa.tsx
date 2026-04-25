import LeafletMap from "../components/LeafletMap";

interface MapaProps {
  isAuthenticated: boolean;
}

export default function Mapa({ isAuthenticated }: MapaProps) {
  return (
    <div className="py-4">
      <LeafletMap className="h-[calc(100vh-200px)] w-full" />
    </div>
  );
}