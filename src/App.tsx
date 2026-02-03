import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Contact from "./pages/Contact";

export default function App() {
  return (
    <BrowserRouter>
      {/* 簡單導覽列（AdSense 喜歡這種結構） */}
      <div className="w-full bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-gray-800">
            費用分攤計算器
          </Link>

          <div className="flex gap-3 text-sm">
            <Link className="text-gray-600 hover:text-gray-900" to="/about">
              關於
            </Link>
            <Link className="text-gray-600 hover:text-gray-900" to="/privacy">
              隱私權
            </Link>
            <Link className="text-gray-600 hover:text-gray-900" to="/contact">
              聯絡
            </Link>
          </div>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      {/* Footer */}
      <div className="py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Expense Splitter
      </div>
    </BrowserRouter>
  );
}
