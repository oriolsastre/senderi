import { ReactNode } from "react";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-cover bg-center bg-no-repeat bg-fixed">
      <div className="flex-1 bg-green-900/30">
        <div className="max-w-4xl mx-auto px-4 flex flex-col flex-1">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
