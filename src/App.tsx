import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase"; // 確保路徑正確：同一層用 ./
import ExpenseSplitter from "./components/ExpenseSplitter";

// 簡單的頁面組件定義，你可以之後再擴充它們的內容
const Privacy = () => (
  <div className="max-w-2xl mx-auto p-8 bg-white mt-10 rounded-2xl shadow-sm">
    <h1 className="text-2xl font-bold mb-4">隱私權政策</h1>
    <p className="text-gray-600 leading-relaxed">我們重視您的隱私。本應用程式僅收集您的 Google 帳戶公開資訊（如姓名、頭像）用於識別身分，並將您輸入的費用資料儲存於 Google Firebase 雲端資料庫中。</p>
    <Link to="/" className="text-indigo-600 mt-6 inline-block font-medium">← 返回首頁</Link>
  </div>
);

const About = () => (
  <div className="max-w-2xl mx-auto p-8 bg-white mt-10 rounded-2xl shadow-sm">
    <h1 className="text-2xl font-bold mb-4">關於我們</h1>
    <p className="text-gray-600 leading-relaxed">這是一款專為旅行、聚餐設計的費用分攤工具。支援雲端儲存，讓您隨時隨地記錄每一筆開支。</p>
    <Link to="/" className="text-indigo-600 mt-6 inline-block font-medium">← 返回首頁</Link>
  </div>
);

const Contact = () => (
  <div className="max-w-2xl mx-auto p-8 bg-white mt-10 rounded-2xl shadow-sm">
    <h1 className="text-2xl font-bold mb-4">聯繫我們</h1>
    <p className="text-gray-600 leading-relaxed">如有任何問題或建議，請聯繫支援團隊。</p>
    <Link to="/" className="text-indigo-600 mt-6 inline-block font-medium">← 返回首頁</Link>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 主要內容區 */}
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<ExpenseSplitter />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>

        {/* 頁尾 - 包含隱私權等連結 */}
        <footer className="bg-white border-t py-8 mt-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="flex justify-center gap-6 mb-4 text-sm font-medium text-gray-500">
              <Link to="/about" className="hover:text-indigo-600 transition-colors">關於我們</Link>
              <Link to="/privacy" className="hover:text-indigo-600 transition-colors">隱私權政策</Link>
              <Link to="/contact" className="hover:text-indigo-600 transition-colors">聯繫我們</Link>
            </div>
            <p className="text-xs text-gray-400">© 2026 費用分攤器. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
