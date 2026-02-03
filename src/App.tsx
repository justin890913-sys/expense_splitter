import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Contact from "./pages/Contact";

// 引入 Firebase 邏輯
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { LogIn, LogOut, User as UserIcon } from "lucide-react"; // 記得安裝 lucide-react

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  // 監聽登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("登入失敗", error);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("確定要登出嗎？")) {
      await signOut(auth);
    }
  };

  return (
    <BrowserRouter>
      {/* 導覽列 */}
      <div className="w-full bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1 rounded">計</span>
            費用分攤計算器
          </Link>

          <div className="flex items-center gap-6">
            {/* 頁面連結 */}
            <div className="hidden md:flex gap-4 text-sm">
              <Link className="text-gray-600 hover:text-indigo-600" to="/about">關於</Link>
              <Link className="text-gray-600 hover:text-indigo-600" to="/privacy">隱私權</Link>
              <Link className="text-gray-600 hover:text-indigo-600" to="/contact">聯絡</Link>
            </div>

            {/* 登入/使用者區塊 */}
            <div className="flex items-center border-l pl-4 ml-2">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-xs font-bold text-gray-800">{user.displayName}</span>
                    <button onClick={handleLogout} className="text-[10px] text-red-400 hover:text-red-600 underline">登出</button>
                  </div>
                  <img 
                    src={user.photoURL || ""} 
                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" 
                    alt="User"
                  />
                  <button onClick={handleLogout} className="sm:hidden text-gray-400">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all shadow-sm"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-3 h-3" alt="G" />
                  <span>登入</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-[calc(100-200px)]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>

      {/* Footer */}
      <div className="py-10 text-center text-xs text-gray-500 bg-gray-50 border-t mt-10">
        <div className="flex justify-center gap-4 mb-4">
            <Link to="/about">關於我們</Link>
            <Link to="/privacy">隱私權政策</Link>
            <Link to="/contact">聯絡支援</Link>
        </div>
        © {new Date().getFullYear()} Expense Splitter. All rights reserved.
      </div>
    </BrowserRouter>
  );
}
