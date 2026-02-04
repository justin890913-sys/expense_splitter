import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { LogIn, LogOut } from 'lucide-react';

import ExpenseSplitter from './components/ExpenseSplitter';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 監聽 Firebase 登入狀態，這會自動偵測不論是從哪邊觸發的登入
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 修改後的 handleLogin：直接觸發畫面中間那個按鈕的點擊事件
  const handleLogin = () => {
    // 透過 ID 或是屬性找到 ExpenseSplitter 裡面的那個 Google 登入按鈕
    // 因為你的 ExpenseSplitter 裡面通常會有一個含有 "Google" 字樣的按鈕
    const mainLoginBtn = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent?.includes('使用 Google 帳號登入')
    );

    if (mainLoginBtn) {
      (mainLoginBtn as HTMLButtonElement).click();
    } else {
      // 如果沒找到按鈕（例如在其他頁面），則提示使用者回到首頁
      window.location.href = '/';
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-bold text-xl text-gray-800 tracking-tight hidden sm:block">分帳小幫手</span>
            </Link>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex gap-4 sm:gap-6 text-sm font-semibold text-gray-500">
                <Link to="/about" className="hover:text-indigo-600 transition-colors">關於工具</Link>
                <Link to="/privacy" className="hover:text-indigo-600 transition-colors">隱私權政策</Link>
                <Link to="/contact" className="hover:text-indigo-600 transition-colors">聯絡我們</Link>
              </div>

              <div className="pl-4 border-l border-gray-200 flex items-center">
                {user ? (
                  <div className="flex items-center gap-3 group">
                    {user.photoURL && (
                      <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border border-gray-200" />
                    )}
                    <button 
                      onClick={handleLogout}
                      className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                      <LogOut className="w-3 h-3" /> 登出
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleLogin}
                    className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-indigo-700 transition shadow-md active:scale-95"
                  >
                    <LogIn className="w-4 h-4" /> 登入
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<ExpenseSplitter />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </main>

        <footer className="py-6 text-center text-gray-400 text-xs border-t bg-white">
          © 2026 Expense Splitter.
        </footer>
      </div>
    </Router>
  );
}

export default App;
