import React, { useEffect, useMemo, useState } from "react";
import {
  PlusCircle,
  Trash2,
  Users,
  DollarSign,
  Calculator,
  Save,
  ArrowLeft,
  Check,
  LogOut,
  LogIn,
  Cloud
} from "lucide-react";

// Firebase 引入
import { auth, db, googleProvider } from "./firebase";
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

type Member = {
  name: string;
  bank: string;
};

type Expense = {
  payer: string;
  amount: string;
  description: string;
  participants: string[];
};

type RecordListItem = {
  id: string;
  name: string;
  updatedAt: string;
};

type RecordData = {
  userId: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  updatedAt: string;
};

type Transaction = {
  from: string;
  to: string;
  amount: number;
  sameBank: boolean;
  bank?: string;
};

type ResultData = {
  totalAmount: number;
  perPerson: number;
  transactions: Transaction[];
  balances: Record<string, number>;
};

export default function ExpenseSplitter() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewMode>("list");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [members, setMembers] = useState<Member[]>([{ name: "", bank: "" }]);
  const [expenses, setExpenses] = useState<Expense[]>([
    { payer: "", amount: "", description: "", participants: [] },
  ]);
  const [result, setResult] = useState<ResultData | null>(null);
  const [recordName, setRecordName] = useState<string>("");
  const [autoSaving, setAutoSaving] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<RecordListItem | null>(null);

  const banks = useMemo(() => [
    "台灣銀行", "土地銀行", "合作金庫", "第一銀行", "華南銀行", "彰化銀行",
    "兆豐銀行", "台灣企銀", "國泰世華", "中國信託", "玉山銀行", "台北富邦",
    "高雄銀行", "台新銀行", "永豐銀行", "聯邦銀行", "遠東銀行", "元大銀行", "其他"
  ], []);

  // --- Firebase 邏輯區 ---

  // 1. 監聽登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadRecordsFromCloud(currentUser.uid);
      } else {
        setRecords([]); // 登出清空列表
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Google 登入/登出
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("登入失敗", error);
      alert("登入失敗，請稍後再試");
    }
  };

  const handleLogout = async () => {
    if (window.confirm("確定要登出嗎？資料將保留在雲端。")) {
      await signOut(auth);
      setView("list");
      setCurrentId(null);
    }
  };

  // 3. 從雲端抓取列表
  const loadRecordsFromCloud = async (uid: string) => {
    try {
      const q = query(
        collection(db, "records"),
        where("userId", "==", uid),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const list: RecordListItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({ id: doc.id, name: data.name, updatedAt: data.updatedAt });
      });
      setRecords(list);
    } catch (e) {
      console.error("載入列表失敗", e);
    }
  };

  // 4. 讀取單筆詳細紀錄
  const openRecord = async (id: string) => {
    setCurrentId(id);
    const docRef = doc(db, "records", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as RecordData;
      setRecordName(data.name);
      setMembers(data.members || [{ name: "", bank: "" }]);
      setExpenses(data.expenses || [{ payer: "", amount: "", description: "", participants: [] }]);
      setResult(null);
      setView("editor");
      window.location.hash = id;
    }
  };

  // 5. 儲存/自動儲存
  const saveToCloud = async (isAuto = false) => {
    if (!user) return alert("請登入後再儲存數據");
    
    if (!isAuto) setAutoSaving(true);
    const id = currentId || Date.now().toString(36);
    const recordData: RecordData = {
      userId: user.uid,
      name: recordName || "未命名紀錄",
      members,
      expenses,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "records", id), recordData);
      setCurrentId(id);
      window.location.hash = id;
      loadRecordsFromCloud(user.uid); // 刷新列表
      if (!isAuto) alert("雲端儲存成功！");
    } catch (e) {
      console.error("儲存失敗", e);
    } finally {
      if (!isAuto) setAutoSaving(false);
    }
  };

  // 監控變化並觸發自動儲存
  useEffect(() => {
    if (user && currentId && view === "editor") {
      const timer = setTimeout(() => saveToCloud(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [members, expenses, recordName]);

  // 6. 刪除紀錄
  const deleteRecordFromCloud = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "records", id));
      setRecords(records.filter(r => r.id !== id));
      setDeleteConfirm(null);
      if (currentId === id) setView("list");
    } catch (e) {
      alert("刪除失敗");
    }
  };

  // --- 計算邏輯 (保持不變) ---
  const calculate = () => {
    const validMembers = members.filter((m) => m.name.trim());
    if (!validMembers.length) return alert("請新增成員");
    const validExpenses = expenses.filter(e => e.payer && e.amount && parseFloat(e.amount) > 0 && e.participants.length);
    if (!validExpenses.length) return alert("請新增有效費用");

    const memberBanks: Record<string, string> = {};
    validMembers.forEach((m) => (memberBanks[m.name] = m.bank));
    const balances: Record<string, number> = {};
    validMembers.forEach((m) => (balances[m.name] = 0));

    let totalAmount = 0;
    validExpenses.forEach((exp) => {
      const amt = parseFloat(exp.amount);
      const pp = amt / exp.participants.length;
      totalAmount += amt;
      if (balances[exp.payer] !== undefined) balances[exp.payer] += amt;
      exp.participants.forEach((p) => {
        if (balances[p] !== undefined) balances[p] -= pp;
      });
    });

    const creditors: { name: string; amount: number; bank: string }[] = [];
    const debtors: { name: string; amount: number; bank: string }[] = [];
    Object.entries(balances).forEach(([p, b]) => {
      if (b > 0.01) creditors.push({ name: p, amount: b, bank: memberBanks[p] });
      else if (b < -0.01) debtors.push({ name: p, amount: -b, bank: memberBanks[p] });
    });

    const transactions: Transaction[] = [];
    // 簡單對沖邏輯 (略，與你原本相同)
    let i = 0, j = 0;
    const tempDebtors = JSON.parse(JSON.stringify(debtors));
    const tempCreditors = JSON.parse(JSON.stringify(creditors));
    while (i < tempDebtors.length && j < tempCreditors.length) {
      const amt = Math.min(tempDebtors[i].amount, tempCreditors[j].amount);
      if (amt > 0.01) transactions.push({
        from: tempDebtors[i].name, to: tempCreditors[j].name, amount: amt,
        sameBank: tempDebtors[i].bank === tempCreditors[j].bank,
        bank: tempCreditors[j].bank
      });
      tempDebtors[i].amount -= amt; tempCreditors[j].amount -= amt;
      if (tempDebtors[i].amount < 0.01) i++;
      if (tempCreditors[j].amount < 0.01) j++;
    }

    setResult({ totalAmount, perPerson: totalAmount / validMembers.length, transactions, balances });
  };

  // --- UI 渲染 ---
  if (view === "list") {
    return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
    <div className="max-w-4xl mx-auto">
      
      {/* --- 強制顯示：頂部導覽列 (無論在哪個頁面都看得到) --- */}
      <nav className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("list")}>
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-gray-800 text-lg">費用分攤器</h1>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL || ""} className="w-8 h-8 rounded-full border border-indigo-100" />
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
              <span className="text-sm font-semibold text-gray-700">登入</span>
            </button>
          )}
        </div>
      </nav>

      {/* --- 內容切換區 --- */}
      {view === "list" ? (
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">我的雲端紀錄</h2>
            <button 
              onClick={() => { setView("editor"); setCurrentId(null); setRecordName(""); }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> 新增計算
            </button>
          </div>

          {/* 如果沒登入，顯示導引區塊 */}
          {!user && (
            <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
              <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">登入後即可備份資料至雲端</p>
              <button onClick={handleLogin} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">立即登入</button>
            </div>
          )}

          {/* 紀錄列表渲染 (與之前代碼相同) */}
          <div className="space-y-3">
            {records.map(record => (
              <div key={record.id} onClick={() => openRecord(record.id)} className="p-4 border rounded-lg hover:border-indigo-500 cursor-pointer transition-all">
                <p className="font-bold text-gray-800">{record.name}</p>
                <p className="text-xs text-gray-400">{new Date(record.updatedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 編輯器模式：放你原本的成員輸入與費用計算表單 */
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
           <button onClick={() => setView("list")} className="mb-4 text-gray-500 flex items-center gap-1">
             <ArrowLeft className="w-4 h-4" /> 返回列表
           </button>
           {/* ... 這裡放你的 Editor 代碼 ... */}
        </div>
      )}

    </div>
  </div>
);
  }

  // 編輯器介面 (大致與原版相同，但加入 Cloud 儲存狀態)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setView("list")} className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
            <div className="flex items-center gap-2">
              {autoSaving ? <span className="text-xs text-indigo-500 animate-pulse">雲端同步中...</span> : <span className="text-xs text-green-500 flex items-center gap-1"><Cloud className="w-3 h-3" /> 已同步</span>}
            </div>
          </div>
          <input
            type="text"
            value={recordName}
            onChange={(e) => setRecordName(e.target.value)}
            placeholder="紀錄名稱（例：台北兩日遊）"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-3"
          />
          <button
            onClick={() => saveToCloud(false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Save className="w-4 h-4" /> 立即手動儲存到雲端
          </button>
        </div>

        {/* 成員與費用清單 (直接沿用你原本的內容即可) */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4">
          {/* ... 此處放入你原本的成員和費用項目的 JSX 代碼 ... */}
          {/* 記得在成員/費用變化時會自動觸發 useEffect 的 saveToCloud */}
          
          {/* 成員區域示例 (簡略版) */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" /> 成員名單</h2>
            {members.map((m, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" value={m.name} onChange={(e) => { const n = [...members]; n[i].name = e.target.value; setMembers(n); }} className="flex-1 px-3 py-2 border rounded-lg" placeholder="姓名" />
                <select value={m.bank} onChange={(e) => { const n = [...members]; n[i].bank = e.target.value; setMembers(n); }} className="w-32 px-2 py-2 border rounded-lg">
                  <option value="">銀行</option>
                  {banks.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <button onClick={() => setMembers(members.filter((_, idx) => idx !== i))} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => setMembers([...members, { name: "", bank: "" }])} className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg">+ 新增成員</button>
          </div>

          {/* 費用區域示例 (簡略版) */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600" /> 費用項目</h2>
            {expenses.map((exp, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg mb-3">
                <input type="text" value={exp.description} onChange={(e) => { const n = [...expenses]; n[i].description = e.target.value; setExpenses(n); }} className="w-full mb-2 px-3 py-2 border rounded-lg" placeholder="費用項目" />
                <div className="flex gap-2 mb-2">
                   <select value={exp.payer} onChange={(e) => { const n = [...expenses]; n[i].payer = e.target.value; setExpenses(n); }} className="flex-1 px-3 py-2 border rounded-lg">
                      <option value="">付款人</option>
                      {members.filter(m => m.name).map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                   </select>
                   <input type="number" value={exp.amount} onChange={(e) => { const n = [...expenses]; n[i].amount = e.target.value; setExpenses(n); }} className="w-24 px-3 py-2 border rounded-lg" placeholder="金額" />
                </div>
                <div className="flex flex-wrap gap-1">
                   {members.filter(m => m.name).map(m => (
                     <button key={m.name} onClick={() => {
                        const n = [...expenses];
                        n[i].participants = n[i].participants.includes(m.name) ? n[i].participants.filter(p => p !== m.name) : [...n[i].participants, m.name];
                        setExpenses(n);
                     }} className={`text-xs px-2 py-1 rounded-full ${exp.participants.includes(m.name) ? "bg-green-500 text-white" : "bg-gray-200"}`}>{m.name}</button>
                   ))}
                </div>
              </div>
            ))}
            <button onClick={() => setExpenses([...expenses, { payer: "", amount: "", description: "", participants: [] }])} className="text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-lg">+ 新增費用</button>
          </div>

          <button onClick={calculate} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">計算分攤結果</button>
        </div>

        {/* 結果展示 (沿用你原本的 result JSX) */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4">計算結果</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">總金額</p>
                <p className="text-2xl font-bold text-indigo-600">${result.totalAmount.toFixed(0)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">每人平均</p>
                <p className="text-2xl font-bold text-green-600">${result.perPerson.toFixed(0)}</p>
              </div>
            </div>
            {/* ... 轉帳方案列表 ... */}
            <div className="space-y-2">
              {result.transactions.map((t, idx) => (
                <div key={idx} className="p-3 border rounded-lg flex justify-between items-center">
                  <span>{t.from} → {t.to}</span>
                  <span className="font-bold text-indigo-600">${t.amount.toFixed(0)} {t.sameBank && <small className="text-green-500">({t.bank})</small>}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

