import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// 引入核心組件
import ExpenseSplitter from './components/ExpenseSplitter';

// 引入你指定的 Page 組件
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 置頂橫幅 Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* 左側標題：點擊回到主功能頁 */}
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="浸9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-bold text-xl text-gray-800 tracking-tight">旅遊分攤小幫手</span>
            </Link>

            {/* 右側按鈕連結 */}
            <div className="flex gap-4 sm:gap-8 text-sm font-semibold">
              <Link 
                to="/about" 
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                關於這個工具
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                聯絡我們
              </Link>
              <Link 
                to="/privacy" 
                className="text-gray-500 hover:text-indigo-600 transition-colors"
              >
                隱私權政策
              </Link>
            </div>
          </div>
        </nav>

        {/* 頁面內容切換區域 */}
        <main className="flex-grow">
          <Routes>
            {/* 預設首頁：顯示原本的計算器功能 */}
            <Route path="/" element={<ExpenseSplitter />} />
            
            {/* 指定頁面路徑 */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </main>

        {/* 簡易頁腳 */}
        <footer className="py-6 text-center text-gray-400 text-xs border-t bg-white">
          © 2026 Expense Splitter. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;

