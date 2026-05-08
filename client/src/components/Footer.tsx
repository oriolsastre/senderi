import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-purple-500/60 py-3 text-center text-xs text-black/60">
      <p className="font-serif italic text-black/80 mb-2">On els camins es troben</p>
      <p>Senderi · <Link to="/info" className="text-purple-600 hover:text-purple-800">Què és?</Link> · <a href="https://github.com/oriolsastre/senderi" target="_blank" className="text-purple-600 hover:text-purple-800">
        Github
      </a>
      </p>
    </footer>
  );
}
