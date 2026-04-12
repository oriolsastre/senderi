import { Link } from "react-router-dom";

interface HeaderProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export default function Header({ isAuthenticated, onLoginClick, onLogoutClick }: HeaderProps) {
  return (
    <header className="h-16 flex justify-between items-center">
      <Link
        to="/"
        className="text-white/80 hover:text-white transition-colors"
      >
        Excursions
      </Link>
      {isAuthenticated ? (
        <button
          onClick={onLogoutClick}
          className="text-white/80 hover:text-white transition-colors"
        >
          Logout
        </button>
      ) : (
        <button
          onClick={onLoginClick}
          className="text-white/80 hover:text-white transition-colors"
        >
          Login
        </button>
      )}
    </header>
  );
}
