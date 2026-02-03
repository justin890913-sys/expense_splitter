import React from "react";
import ExpenseSplitter from "../components/ExpenseSplitter"; // 假設你的主要功能在組件裡
import { Cloud, LogIn } from "lucide-react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

export default function Home() {
  // 我們不需要在這邊重新監聽 auth，因為 App.tsx 會處理
  // 但我們可以直接從 Firebase auth 取得當前使用者，或者這元件會自動重新渲染
  const user = auth.currentUser;

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("登入失敗", error);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-4">
      {/* 1. 如果使用者已登入，直接顯示功能主體 */}
      {user ? (
        <ExpenseSplitter />
      ) : (
        /* 2. 如果使用者未登入，顯示一個漂亮的引導頁面 (Landing Page) */
        <div className="py-12 px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-800 mb-4">
              簡單、快速、雲端同步的費用分攤
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-8">
              不再需要手寫帳單。登入 Google 帳號，隨時隨地記錄旅行支出，並自動計算每人應付金額。
            </p>
            <button 
              onClick={handleLogin}
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 brightness-200" alt="G" />
              立即開始使用
            </button>
          </div>

          {/* 特色介紹 */}
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Cloud className="w-6 h-6 text-blue-500" />} 
              title="雲端同步" 
              desc="換台電腦、換個手機，紀錄永遠都在。"
            />
            <FeatureCard 
              icon={<LogIn className="w-6 h-6 text-green-500" />} 
              title="免註冊" 
              desc="直接使用 Google 帳號登入，安全快速。"
            />
            <FeatureCard 
              icon={<div className="font-bold text-indigo-600">Free</div>} 
              title="完全免費" 
              desc="為開發者專案，不收任何費用。"
            />
          </div>
        </div>
      )}
    </main>
  );
}

// 小組件：特色卡片
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="mb-4">{icon}</div>
      <h4 className="font-bold text-gray-800 mb-2">{title}</h4>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );
}
