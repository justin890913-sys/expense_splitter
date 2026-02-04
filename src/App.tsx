import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LogIn, LogOut, User } from 'lucide-react';
import ExpenseSplitter from './components/ExpenseSplitter';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';

// Firebase 相關
import { auth, googleProvider } from "./firebase";
import { 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. 處理從 Google 登入跳轉回來的結果 (解決 COOP 錯誤的關鍵)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("跳轉登入成功:", result.user.email);
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error("跳轉結果處理失敗:", error);
      });

    // 2. 監聽全域登入狀態改變
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      // 解決 COOP 錯誤最好的辦法是全平台都用 Redirect
      await signInWithRedirect(auth, googleProvider);
    } catch (e: any) {
      alert("登入失敗: " + e.message);
    }
  };

  const handleLogout = () => signOut(auth).then(() => {
    window.location.href = "/"; // 登出後導回首頁並重新整理狀態
  });

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="font-bold text-indigo-600 text-xl flex items-center gap-2">
              <span className="bg-indigo-600 text-white p-1.5 rounded-lg">計</span>
              費用分攤
            </Link>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-800">{user.displayName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    title="登出"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold transition-all active:scale-95 shadow-md shadow-indigo-100"
                >
                  <LogIn className="w-4 h-4" />
                  登入
                </button>
              )}
            </div>
          </div>
        </nav>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<ExpenseSplitter user={user} />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </main>

        <footer className="bg-white border-t py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="flex justify-center gap-6 mb-4 text-sm text-gray-500 font-medium">
              <Link to="/about" className="hover:text-indigo-600">關於我們</Link>
              <Link to="/contact" className="hover:text-indigo-600">聯絡我們</Link>
              <Link to="/privacy" className="hover:text-indigo-600">隱私條款</Link>
            </div>
            <p className="text-xs text-gray-400">© 2024 費用分攤計算器. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from "firebase/auth";
import { LogIn, LogOut } from 'lucide-react';

import ExpenseSplitter from './components/ExpenseSplitter';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    const isMobile = /iPhone|iPad|iPod|Android|Line|FBAN|FBAV/i.test(navigator.userAgent);
    try {
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (e) {
      console.error("登入失敗", e);
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
              <span className="font-bold text-xl text-gray-800 tracking-tight hidden sm:block">分錢小幫手</span>
            </Link>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex gap-4 sm:gap-6 text-sm font-semibold text-gray-500">
                <Link to="/about" className="hover:text-indigo-600 transition-colors">關於工具</Link>
                <Link to="/privacy" className="hover:text-indigo-600 transition-colors">隱私權政策</Link>
                <Link to="/contact" className="hover:text-indigo-600 transition-colors">聯絡我們</Link>
              </div>

              {/* 登入/登出按鈕放置於此 */}
              <div className="pl-4 border-l border-gray-200 flex items-center">
                {user ? (
                  <div className="flex items-center gap-3 group">
                    <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border border-gray-200" />
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

