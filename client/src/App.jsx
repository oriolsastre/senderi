import { BrowserRouter, Routes, Route } from "react-router-dom";
import List from "./pages/List";
// import Hike from "./pages/Hike";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<List />} />
                <Route path="/:id" element={<Hike />} />
            </Routes>
        </BrowserRouter>
    );
}