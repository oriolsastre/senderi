import { useState } from "react";
import { Link } from "react-router-dom";
import { UserIcon, ArrowRightStartOnRectangleIcon, Bars3Icon } from "@heroicons/react/24/solid";

interface MenuProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export default function Menu({ isAuthenticated, onLoginClick, onLogoutClick }: MenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="text-black/80 hover:text-black hover:border-purple-500 hover:shadow-[0_0_8px_rgba(168,85,247,0.5)] cursor-pointer p-2 rounded border border-transparent transition-colors"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-purple-500 rounded-lg shadow-lg min-w-40 z-50">
          <div className="bg-green-900/30 rounded-t-lg rounded-b-lg">
            <Link
              to="/"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-black/80 hover:bg-green-900/20 cursor-pointer"
            >
              <img src="/assets/icons/hiking.svg" alt="" className="w-4 h-4" />
              Excursions
            </Link>
            <hr className="my-1 border-green-900/20" />
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onLogoutClick();
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-black/80 hover:bg-green-900/20 cursor-pointer"
              >
                <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                Surt
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowMenu(false);
                  onLoginClick();
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-black/80 hover:bg-green-900/20 cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                Entra
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}