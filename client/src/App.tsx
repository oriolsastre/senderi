import { BrowserRouter, Routes, Route } from "react-router-dom";
import List from "./pages/List";
import Excursio from "./pages/Excursio";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<List />} />
                <Route path="/:slug" element={<Excursio />} />
            </Routes>
        </BrowserRouter>
    );
}
