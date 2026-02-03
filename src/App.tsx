import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Contact from "./pages/Contact";

// 1. 確保引入了這些圖示，漏掉任何一個都會導致畫面全白
import { LogIn, LogOut } from "lucide-react"; 
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 在 ExpenseSplitter 函數內定義
  const Navbar = () => (
    <nav className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
      {/* 左側標誌 */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("list")}>
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-gray-800 text-lg">雲端分攤器</h1>
      </div>

      {/* 右側按鈕區 */}
      <div className="flex items-center">
        {user ? (
          /* 已登入：顯示頭像與登出 */
          <div className="flex items-center gap-3 bg-indigo-50 pl-3 pr-1 py-1 rounded-full border border-indigo-100">
            <span className="text-sm font-medium text-indigo-700 hidden sm:block">
              {user.displayName}
            </span>
            <img 
              src={user.photoURL || ""} 
              className="w-8 h-8 rounded-full border-2 border-white" 
              alt="User"
            />
            <button 
              onClick={handleLogout} 
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* 未登入：強制顯示登入按鈕 */
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95 text-gray-700 font-bold text-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
            登入
          </button>
        )}
      </div>
    </nav>
  );

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <BrowserRouter>
      <nav className="w-full bg-white border-b px-4 py-3 flex justify-between items-center">
        <Link to="/" className="font-bold text-indigo-600 text-lg">費用分攤器</Link>
        
        <div className="flex items-center gap-4">
          <Link to="/about" className="text-sm text-gray-600">關於</Link>
          {user ? (
            <div className="flex items-center gap-2">
              <img src={user.photoURL || ""} className="w-8 h-8 rounded-full" />
              <button onClick={() => signOut(auth)} className="text-gray-500"><LogOut className="w-4 h-4"/></button>
            </div>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-1 border px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-50">
              <LogIn className="w-4 h-4" /> 登入
            </button>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}

