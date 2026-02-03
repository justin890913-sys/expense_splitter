import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";

// 正確導入路徑
import { auth } from "./firebase"; 
import ExpenseSplitter from "./components/ExpenseSplitter";
import Home from "./pages/Home";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 路由內容區 */}
        <div className="flex-grow">
          <Routes>
            {/* 首頁 */}
            <Route path="/" element={<Home />} />
            
            {/* 隱私權政策與其他頁面 */}
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>

        {/* 頁尾：確保使用者隨時能找到隱私權政策 */}
        <footer className="bg-white border-t py-10 mt-auto">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex justify-center gap-8 mb-4 text-sm font-semibold text-gray-500">
              <Link to="/" className="hover:text-indigo-600 transition-colors">回首頁</Link>
              <Link to="/about" className="hover:text-indigo-600 transition-colors">關於我們</Link>
              <Link to="/privacy" className="hover:text-indigo-600 transition-colors">隱私權政策</Link>
              <Link to="/contact" className="hover:text-indigo-600 transition-colors">聯繫我們</Link>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">© 2026 費用分攤器. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
