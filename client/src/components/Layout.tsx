import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed">
      <div className="min-h-screen bg-green-900/30">
        <div className="max-w-4xl mx-auto px-4">
          {children}
        </div>
      </div>
    </div>
  );
}
