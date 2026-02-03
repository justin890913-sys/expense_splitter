import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ExpenseSplitter from './components/ExpenseSplitter';

// 假設你的 pages 資料夾中有這些組件
// 如果尚未建立，請確保檔案存在或先用簡單的 Function 代替
const About = () => <div className="p-8 text-center mt-10"><h2>關於這個工具</h2><p>這是一個方便大家出去玩分錢的小工具。</p></div>;
const Privacy = () => <div className="p-8 text-center mt-10"><h2>隱私權政策</h2><p>我們不會將您的個人資料提供給第三方。</p></div>;
const Contact = () => <div className="p-8 text-center mt-10"><h2>聯絡我們</h2><p>如有問題請寄信至：support@example.com</p></div>;

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* 置頂橫幅 Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* 左側標題：點擊可回到主功能 */}
            <Link to="/" className="font-bold text-indigo-600 hover:text-indigo-700 transition">
              分錢小幫手
            </Link>

            {/* 右側按鈕連結 */}
            <div className="flex gap-4 sm:gap-6 text-sm font-medium text-gray-600">
              <Link to="/about" className="hover:text-indigo-600 transition">關於工具</Link>
              <Link to="/privacy" className="hover:text-indigo-600 transition">隱私權政策</Link>
              <Link to="/contact" className="hover:text-indigo-600 transition">聯絡我們</Link>
            </div>
          </div>
        </nav>

        {/* 頁面內容切換 */}
        <main>
          <Routes>
            {/* 首頁直接顯示你的核心功能 */}
            <Route path="/" element={<ExpenseSplitter />} />
            
            {/* 其他頁面連結 */}
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
