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
