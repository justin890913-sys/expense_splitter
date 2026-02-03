import React, { useEffect, useState } from "react";
import { 
  Calculator, LogIn, LogOut, PlusCircle, Cloud, 
  ChevronRight, ArrowLeft, Users, DollarSign, Save, Trash2, CheckCircle2
} from "lucide-react";

// Firebase 配置
import { auth, db, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, setDoc, doc, orderBy, getDoc } from "firebase/firestore";

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

export default function ExpenseSplitter() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<"list" | "editor">("list");
  const [records, setRecords] = useState<any[]>([]);
  
  // 編輯器狀態
  const [recordName, setRecordName] = useState("");
  const [members, setMembers] = useState<Member[]>([{ name: "", bank: "" }]);
  const [expenses, setExpenses] = useState<Expense[]>([
    { payer: "", amount: "", description: "", participants: [] }
  ]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);

  const banks = ["台灣銀行", "土地銀行", "第一銀行", "華南銀行", "彰化銀行", "兆豐銀行", "國泰世華", "中國信託", "玉山銀行", "台北富邦", "台新銀行", "其他"];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) fetchRecords(u.uid);
    });
    return () => unsub();
  }, []);

  const fetchRecords = async (uid: string) => {
    try {
      const q = query(collection(db, "records"), where("userId", "==", uid), orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth).then(() => { setView("list"); setRecords([]); });

  const saveToCloud = async () => {
    if (!user) return alert("請先登入以儲存紀錄");
    setAutoSaving(true);
    const id = currentId || Date.now().toString(36);
    await setDoc(doc(db, "records", id), {
      userId: user.uid,
      name: recordName || "未命名紀錄",
      members,
      expenses,
      updatedAt: new Date().toISOString()
    });
    setCurrentId(id);
    fetchRecords(user.uid);
    setAutoSaving(false);
  };

  const openRecord = async (id: string) => {
    const snap = await getDoc(doc(db, "records", id));
    if (snap.exists()) {
      const d = snap.data();
      setRecordName(d.name);
      setMembers(d.members || []);
      setExpenses(d.expenses || []);
      setCurrentId(id);
      setView("editor");
    }
  };

  // --- 計算分攤邏輯 ---
  const calculateResult = () => {
    const balances: Record<string, number> = {};
    members.forEach(m => { if (m.name) balances[m.name] = 0; });

    expenses.forEach(exp => {
      const amount = parseFloat(exp.amount) || 0;
      if (amount <= 0 || !exp.payer || exp.participants.length === 0) return;

      // 付款人增加餘額
      balances[exp.payer] += amount;
      // 參與者平分支出
      const share = amount / exp.participants.length;
      exp.participants.forEach(p => {
        balances[p] -= share;
      });
    });

    const debtors: { name: string, amount: number }[] = [];
    const creditors: { name: string, amount: number }[] = [];

    Object.entries(balances).forEach(([name, bal]) => {
      if (bal < -0.01) debtors.push({ name, amount: Math.abs(bal) });
      else if (bal > 0.01) creditors.push({ name, amount: bal });
    });

    const transactions: { from: string, to: string, amount: number, bank?: string }[] = [];
    let dIdx = 0, cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const d = debtors[dIdx];
      const c = creditors[cIdx];
      const settle = Math.min(d.amount, c.amount);

      transactions.push({
        from: d.name,
        to: c.name,
        amount: Math.round(settle),
        bank: members.find(m => m.name === c.name)?.bank
      });

      d.amount -= settle;
      c.amount -= settle;
      if (d.amount <= 0) dIdx++;
      if (c.amount <= 0) cIdx++;
    }
    return transactions;
  };

  const finalResults = calculateResult();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("list")}>
            <div className="bg-indigo-600 p-1.5 rounded-lg"><Calculator className="text-white w-5 h-5" /></div>
            <span className="font-bold text-lg">費用分攤器</span>
          </div>
          {user ? (
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full pr-3">
              <img src={user.photoURL!} className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
              <button onClick={handleLogout} className="text-xs font-bold text-gray-500">登出</button>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-transform active:scale-95">登入</button>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-4 pt-6">
        {view === "list" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl">我的紀錄</h2>
              <button onClick={() => { setView("editor"); setCurrentId(null); setRecordName(""); setMembers([{name:"", bank:""}]); setExpenses([{payer:"", amount:"", description:"", participants:[]}]); }} className="bg-white border px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-gray-50">
                <PlusCircle className="w-4 h-4" /> 新增
              </button>
            </div>
            {!user ? (
              <div className="bg-white border-2 border-dashed rounded-3xl p-12 text-center">
                <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <button onClick={handleLogin} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">Google 登入</button>
              </div>
            ) : records.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border">尚無紀錄</div>
            ) : (
              <div className="grid gap-3">
                {records.map(r => (
                  <div key={r.id} onClick={() => openRecord(r.id)} className="bg-white p-4 rounded-2xl flex justify-between items-center border hover:border-indigo-200 cursor-pointer shadow-sm group">
                    <div>
                      <div className="font-bold text-gray-800 group-hover:text-indigo-600">{r.name || "未命名紀錄"}</div>
                      <div className="text-xs text-gray-400">{new Date(r.updatedAt).toLocaleDateString()}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setView("list")} className="flex items-center gap-1 text-gray-400 text-sm"><ArrowLeft className="w-4 h-4" /> 返回</button>
                <button onClick={saveToCloud} className="text-indigo-600 text-sm font-bold flex items-center gap-1">
                  {autoSaving ? "儲存中..." : <><Save className="w-4 h-4" /> 儲存雲端</>}
                </button>
              </div>
              <input className="text-2xl font-black w-full mb-6 border-b-2 border-transparent focus:border-indigo-100 outline-none pb-2" placeholder="行程名稱..." value={recordName} onChange={(e) => setRecordName(e.target.value)} />

              <section className="mb-8">
                <h3 className="flex items-center gap-2 font-bold text-gray-700 mb-4"><Users className="w-4 h-4 text-indigo-500" /> 成員與銀行</h3>
                {members.map((m, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input placeholder="姓名" className="flex-1 bg-gray-50 rounded-xl px-4 py-2 text-sm outline-none" value={m.name} onChange={(e) => {
                      const next = [...members]; next[i].name = e.target.value; setMembers(next);
                    }} />
                    <select className="bg-gray-50 rounded-xl px-2 py-2 text-sm outline-none" value={m.bank} onChange={(e) => {
                      const next = [...members]; next[i].bank = e.target.value; setMembers(next);
                    }}>
                      <option value="">選擇銀行</option>
                      {banks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <button onClick={() => setMembers(members.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setMembers([...members, { name: "", bank: "" }])} className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs font-bold">+ 新增成員</button>
              </section>

              <section className="mb-8">
                <h3 className="flex items-center gap-2 font-bold text-gray-700 mb-4"><DollarSign className="w-4 h-4 text-green-500" /> 費用清單</h3>
                {expenses.map((exp, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-2xl mb-4 space-y-3">
                    <div className="flex gap-2">
                      <select className="flex-1 bg-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-100" value={exp.payer} onChange={(e) => {
                        const next = [...expenses]; next[i].payer = e.target.value; setExpenses(next);
                      }}>
                        <option value="">付款人</option>
                        {members.filter(m => m.name).map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                      </select>
                      <input type="number" placeholder="金額" className="w-24 bg-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-100" value={exp.amount} onChange={(e) => {
                        const next = [...expenses]; next[i].amount = e.target.value; setExpenses(next);
                      }} />
                    </div>
                    <input placeholder="描述 (例如：晚餐、車資)" className="w-full bg-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-100" value={exp.description} onChange={(e) => {
                      const next = [...expenses]; next[i].description = e.target.value; setExpenses(next);
                    }} />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {members.filter(m => m.name).map(m => (
                        <button key={m.name} onClick={() => {
                          const next = [...expenses];
                          if (next[i].participants.includes(m.name)) {
                            next[i].participants = next[i].participants.filter(p => p !== m.name);
                          } else {
                            next[i].participants.push(m.name);
                          }
                          setExpenses(next);
                        }} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${exp.participants.includes(m.name) ? "bg-indigo-600 text-white" : "bg-white text-gray-400 border"}`}>
                          {m.name}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setExpenses(expenses.filter((_, idx) => idx !== i))} className="text-xs text-red-400 font-medium">刪除此項</button>
                  </div>
                ))}
                <button onClick={() => setExpenses([...expenses, { payer: "", amount: "", description: "", participants: [] }])} className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs font-bold">+ 新增費用</button>
              </section>
            </div>

            {/* 分攤結果區 */}
            <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
              <h3 className="flex items-center gap-2 font-bold mb-6 text-indigo-200"><CheckCircle2 className="w-5 h-5" /> 分攤結算結果</h3>
              {finalResults && finalResults.length > 0 ? (
                <div className="space-y-4">
                  {finalResults.map((res, i) => (
                    <div key={i} className="flex justify-between items-center bg-indigo-800/50 p-4 rounded-2xl border border-indigo-700/50">
                      <div>
                        <div className="text-sm text-indigo-300">{res.from} 應該給</div>
                        <div className="font-bold text-lg">{res.to}</div>
                        {res.bank && <div className="text-xs text-indigo-400 mt-1">({res.bank})</div>}
                      </div>
                      <div className="text-2xl font-black text-yellow-400">${res.amount}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-indigo-300 text-sm">請輸入費用以計算結果</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
