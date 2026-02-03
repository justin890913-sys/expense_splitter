import React, { useEffect, useMemo, useState } from "react";
import {
  PlusCircle,
  Trash2,
  Users,
  DollarSign,
  Calculator,
  Save,
  ArrowLeft,
  LogOut,
  Cloud,
  ChevronRight,
  AlertCircle
} from "lucide-react";

// Firebase 引入 (請確保你已建立 src/firebase.ts)
import { auth, db, googleProvider } from ".../firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  getDocs, 
  where, 
  deleteDoc, 
  orderBy 
} from "firebase/firestore";

type ViewMode = "list" | "editor";

interface Member {
  name: string;
  bank: string;
}

interface Expense {
  payer: string;
  amount: string;
  description: string;
  participants: string[];
}

interface RecordListItem {
  id: string;
  name: string;
  updatedAt: string;
}

export default function ExpenseSplitter() {
  // 核心狀態
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewMode>("list");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordListItem[]>([]);
  
  // 編輯器狀態
  const [recordName, setRecordName] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([{ name: "", bank: "" }]);
  const [expenses, setExpenses] = useState<Expense[]>([
    { payer: "", amount: "", description: "", participants: [] },
  ]);
  const [autoSaving, setAutoSaving] = useState(false);

  const banks = [
    "台灣銀行", "土地銀行", "合作金庫", "第一銀行", "華南銀行", "彰化銀行",
    "兆豐銀行", "國泰世華", "中國信託", "玉山銀行", "台北富邦", "台新銀行", "其他"
  ];

  // --- 1. Firebase 身份監聽 ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchRecords(currentUser.uid);
      } else {
        setRecords([]);
        setView("list");
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 2. 登入/登出功能 ---
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
      alert("登入失敗，請檢查 Firebase 設定");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentId(null);
    setView("list");
  };

  // --- 3. 資料庫操作 ---
  const fetchRecords = async (uid: string) => {
    try {
      const q = query(
        collection(db, "records"),
        where("userId", "==", uid),
        orderBy("updatedAt", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as RecordListItem));
      setRecords(list);
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  };

  const saveToCloud = async (isAuto = false) => {
    if (!user) return;
    if (!isAuto) setAutoSaving(true);

    const id = currentId || Date.now().toString(36);
    const data = {
      userId: user.uid,
      name: recordName || "未命名紀錄",
      members,
      expenses,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "records", id), data);
      setCurrentId(id);
      if (!isAuto) {
        alert("儲存成功");
        fetchRecords(user.uid);
      }
    } catch (e) {
      console.error("Save Error:", e);
    } finally {
      setAutoSaving(false);
    }
  };

  const openRecord = async (id: string) => {
    const docRef = doc(db, "records", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      setRecordName(data.name);
      setMembers(data.members);
      setExpenses(data.expenses);
      setCurrentId(id);
      setView("editor");
    }
  };

  // --- 4. UI 元件：導覽列 (保證登入按鈕在此) ---
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

  return (
    <div className="min-h-screen bg-[#f8f9ff] p-3 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <Navbar />

        {view === "list" ? (
          /* 列表頁面 */
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-black text-gray-800">我的紀錄</h2>
              <button 
                onClick={() => { setView("editor"); setCurrentId(null); setRecordName(""); setMembers([{name:"", bank:""}]); setExpenses([{payer:"", amount:"", description:"", participants:[]}]); }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100"
              >
                <PlusCircle className="w-4 h-4" /> 新增
              </button>
            </div>

            {!user ? (
              <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                <Cloud className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
                <h3 className="font-bold text-gray-700 mb-2">登入以同步資料</h3>
                <p className="text-gray-400 text-sm mb-6">登入後即可在任何裝置存取您的分攤紀錄</p>
                <button onClick={handleLogin} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all">
                  立即登入
                </button>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-20 text-gray-400 bg-white rounded-3xl">尚無雲端紀錄，點擊右上方「新增」</div>
            ) : (
              <div className="grid gap-3">
                {records.map(record => (
                  <div 
                    key={record.id} 
                    onClick={() => openRecord(record.id)}
                    className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-transparent hover:border-indigo-200 cursor-pointer transition-all group"
                  >
                    <div>
                      <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{record.name || "未命名紀錄"}</h3>
                      <p className="text-xs text-gray-400">{new Date(record.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 編輯器頁面 */
          <div className="bg-white rounded-3xl shadow-xl p-5 border border-indigo-50">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setView("list")} className="flex items-center gap-1 text-gray-400 hover:text-indigo-600 font-medium text-sm">
                <ArrowLeft className="w-4 h-4" /> 返回
              </button>
              {user && (
                <button onClick={() => saveToCloud()} disabled={autoSaving} className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                  {autoSaving ? "儲存中..." : <><Save className="w-4 h-4" /> 儲存紀錄</>}
                </button>
              )}
            </div>

            <input 
              className="text-2xl font-black w-full mb-6 focus:outline-none border-b-2 border-transparent focus:border-indigo-100 pb-2"
              placeholder="給這趟行程一個名字..."
              value={recordName}
              onChange={(e) => setRecordName(e.target.value)}
            />

            {/* 成員編輯區 */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold">
                <Users className="w-5 h-5" /> 參與成員
              </div>
              {members.map((m, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input 
                    placeholder="姓名"
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    value={m.name}
                    onChange={(e) => {
                      const newM = [...members];
                      newM[i].name = e.target.value;
                      setMembers(newM);
                    }}
                  />
                  <select 
                    className="w-28 bg-gray-50 border-none rounded-xl px-2 py-2 text-sm"
                    value={m.bank}
                    onChange={(e) => {
                      const newM = [...members];
                      newM[i].bank = e.target.value;
                      setMembers(newM);
                    }}
                  >
                    <option value="">銀行</option>
                    {banks.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <button onClick={() => setMembers(members.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button 
                onClick={() => setMembers([...members, { name: "", bank: "" }])}
                className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                + 新增成員
              </button>
            </section>

            {/* 費用編輯區 (這裡你可以放入你原本最擅長的計算 logic) */}
            <section>
               <div className="flex items-center gap-2 mb-4 text-green-600 font-bold">
                <DollarSign className="w-5 h-5" /> 費用支出
              </div>
              <p className="text-center py-4 text-gray-400 text-sm italic">請在此繼續加入您的費用輸入與計算邏輯...</p>
              
              <button 
                onClick={() => alert("功能開發中，請在此加入您的計算函式！")}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 mt-4 active:scale-95 transition-transform"
              >
                計算分攤結果
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}







