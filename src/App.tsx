import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { auth, googleProvider } from "./firebase";
import { 
  signInWithPopup, 
  signInWithRedirect, 
  signOut, 
  onAuthStateChanged, 
  getRedirectResult 
} from "firebase/auth";
import { LogIn, LogOut } from 'lucide-react';

import ExpenseSplitter from './components/ExpenseSplitter';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. 監聽全域登入狀態
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    // 2. 關鍵：接住手機版 Redirect 跳轉回來的結果
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("跳轉登入成功");
        }
      })
      .catch((error) => {
        console.error("跳轉結果處理失敗", error);
      });

    return () => unsub();
  }, []);

  const handleLogin = async () => {
    // 偵測包含 LINE 和 FB 的環境
    const isMobile = /iPhone|iPad|iPod|Android|Line|FBAN|FBAV/i.test(navigator.userAgent);
    try {
      if (isMobile) {
        // 手機版：強制跳轉
        await signInWithRedirect(auth, googleProvider);
      } else {
        // 電腦版：彈出視窗
        await signInWithPopup(auth, googleProvider);
      }
    } catch (e) {
      console.error("登入失敗", e);
      alert("登入出現問題，請嘗試使用外部瀏覽器（如 Chrome/Safari）開啟。");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (e) {
      console.error("登出失敗", e);
    }
  };

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
              <span className="font-bold text-xl text-gray-800 tracking-tight hidden sm:block">分錢小幫手</span>
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
            {/* 這裡必須要把 user 傳下去，否則 ExpenseSplitter 不知道登入狀態 */}
            <Route path="/" element={<ExpenseSplitter user={user} />} />
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
