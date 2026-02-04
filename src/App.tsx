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
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. 監聽全域登入狀態改變
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    // 2. 關鍵：處理手機版 Redirect 回來後的結果
    getRedirectResult(auth).catch((error) => {
      console.error("手機版跳轉登入失敗:", error);
    });

    return () => unsub();
  }, []);

  const handleLogin = async () => {
    // 判斷是否為行動裝置
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    try {
      if (isMobile) {
        // 手機使用 Redirect
        await signInWithRedirect(auth, googleProvider);
      } else {
        // 電腦使用 Popup
        await signInWithPopup(auth, googleProvider);
      }
    } catch (e: any) {
      alert("登入失敗: " + e.message);
    }
  };

  const handleLogout = () => signOut(auth);

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

export default App;
