import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase"; // 正確路徑：同一層用 ./
import ExpenseSplitter from "./components/ExpenseSplitter";

// 假設你還有其他頁面，如果沒有，這部分可以保持簡單
export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ExpenseSplitter />} />
      </Routes>
    </BrowserRouter>
  );
}
