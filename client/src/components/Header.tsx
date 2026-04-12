import { Link } from "react-router-dom";
import { UserIcon, ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/solid";

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
        className="text-black/80 hover:text-black transition-colors"
      >
        Excursions
      </Link>
      {isAuthenticated ? (
        <button
          onClick={onLogoutClick}
          title="Surt"
          className="text-black/80 hover:text-black hover:bg-black/10 cursor-pointer p-2 rounded transition-colors"
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={onLoginClick}
          title="Entra"
          className="text-black/80 hover:text-black hover:bg-black/10 cursor-pointer p-2 rounded transition-colors"
        >
          <UserIcon className="w-5 h-5" />
        </button>
      )}
    </header>
  );
}
