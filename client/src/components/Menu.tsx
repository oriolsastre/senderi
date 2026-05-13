import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserIcon, ArrowRightStartOnRectangleIcon, Bars3Icon, MapIcon, QuestionMarkCircleIcon, PencilSquareIcon } from "@heroicons/react/24/solid";

interface MenuProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export default function Menu({ isAuthenticated, onLoginClick, onLogoutClick }: MenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="text-black/80 hover:text-black hover:border-purple-500 hover:shadow-[0_0_8px_rgba(168,85,247,0.5)] cursor-pointer p-2 rounded border border-transparent transition-colors"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-purple-500 rounded-lg shadow-lg min-w-40 z-[9999]">
          <div className="bg-green-900/30 rounded-t-lg rounded-b-lg">
            <Link
              to="/"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-black/80 hover:bg-green-900/20 cursor-pointer"
            >
              <img src="/assets/icons/hiking.svg" alt="" className="w-4 h-4" />
              Excursions
            </Link>
            <Link
              to="/mapa"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-black/80 hover:bg-green-900/20 cursor-pointer"
            >
              <MapIcon className="w-4 h-4" />
              Mapa
            </Link>
            <Link
              to="/informe"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-black/80 hover:bg-green-900/20 cursor-pointer"
            >
              <PencilSquareIcon className="w-4 h-4" />
              Informe
            </Link>
            <Link
              to="/info"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-black/80 hover:bg-green-900/20 cursor-pointer"
            >
              <QuestionMarkCircleIcon className="w-4 h-4" />
              Què és?
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
            {isAuthenticated && (
              <>
                <hr className="my-1 border-green-900/20" />
                <a
                  href="https://www.openstreetmap.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-black/80 hover:bg-green-900/20 cursor-pointer"
                >
                  <img src="/assets/icons/services/openstreetmap-logo.svg" alt="OSM" className="w-4 h-4" />
                  OSM
                </a>
                <a
                  href="https://www.wikidata.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-black/80 hover:bg-green-900/20 cursor-pointer"
                >
                  <img src="/assets/icons/services/wikidata-logo.svg" alt="Wikidata" className="w-4 h-4" />
                  Wikidata
                </a>
                <a
                  href="https://visors.icgc.cat/vissir/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-black/80 hover:bg-green-900/20 cursor-pointer"
                >
                  <img src="https://www.icgc.cat/themes/custom/icgc_web/favicon.ico" alt="Vissir" className="w-4 h-4" />
                  Vissir
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}