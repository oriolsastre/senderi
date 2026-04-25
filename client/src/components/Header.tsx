import { Link } from "react-router-dom";
import Menu from "./Menu";

interface HeaderProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export default function Header({ isAuthenticated, onLoginClick, onLogoutClick }: HeaderProps) {
  return (
    <header className="h-16 flex justify-between items-center">
      <div className="w-10"></div>
      <Link
        to="/"
        className="text-3xl font-serif font-bold text-black/80 hover:text-black transition-colors"
      >
        Senderi
      </Link>
      <Menu
        isAuthenticated={isAuthenticated}
        onLoginClick={onLoginClick}
        onLogoutClick={onLogoutClick}
      />
    </header>
  );
}