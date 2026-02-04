import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Users, DollarSign, Calculator, Save, ArrowLeft, Check, LogIn, LogOut, Cloud } from 'lucide-react';

// Firebase 配置
import { auth, db, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, setDoc, doc, orderBy, getDoc, deleteDoc } from "firebase/firestore";

export default function ExpenseSplitter() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'editor'
  const [currentId, setCurrentId] = useState(null);
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([{ name: '', bank: '' }]);
  const [expenses, setExpenses] = useState([{ payer: '', amount: '', description: '', participants: [] }]);
  const [result, setResult] = useState(null);
  const [recordName, setRecordName] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // 儲存要刪除的紀錄ID
  const [saveSuccess, setSaveSuccess] = useState(false);

  const banks = ['台灣銀行', '土地銀行', '合作金庫', '第一銀行', '華南銀行', '彰化銀行', '兆豐銀行', '台灣企銀', '國泰世華', '中國信託', '玉山銀行', '台北富邦', '國泰銀行', '高雄銀行', '台新銀行', '永豐銀行', '聯邦銀行', '遠東銀行', '元大銀行', '其他'];

  // 監聽登入狀態
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        loadRecordsList(u.uid);
      } else {
        setRecords([]);
      }
    });
    return () => unsub();
  }, []);

  // 自動儲存計時器
  useEffect(() => {
    if (user && currentId && view === 'editor') {
      const timer = setTimeout(() => {
        autoSaveRecord();
      }, 2000); // 2秒後自動儲存

      return () => clearTimeout(timer);
    }
  }, [members, expenses, recordName, currentId, view, user]);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      loadRecord(hash);
      setView('editor');
    }
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      alert("登入失敗: " + e.message);
    }
  };

  const handleLogout = () => signOut(auth).then(() => { setView('list'); setRecords([]); });

  const loadRecordsList = async (uid) => {
    try {
      const q = query(collection(db, "records"), where("userId", "==", uid), orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(data);
    } catch (e) {
      console.error("載入列表失敗:", e);
      setRecords([]);
    }
  };

  const loadRecord = async (id) => {
    try {
      const snap = await getDoc(doc(db, "records", id));
      if (snap.exists()) {
        const record = snap.data();
        setCurrentId(id);
        setRecordName(record.name || '');
        setMembers(record.members || [{ name: '', bank: '' }]);
        setExpenses(record.expenses || [{ payer: '', amount: '', description: '', participants: [] }]);
        setResult(null);
      }
    } catch (e) {
      alert('無法載入計算紀錄');
    }
  };

  const saveRecord = async () => {
  if (!user) return alert("請先登入帳號");
  const name = recordName || '未命名紀錄';
  
  const docRef = currentId ? doc(db, "records", currentId) : doc(collection(db, "records"));
  const newId = docRef.id;

  const recordData = {
    userId: user.uid,
    name,
    members,
    expenses,
    updatedAt: new Date().toISOString()
  };

  try {
    setAutoSaving(true);
    setSaveSuccess(false); // 開始儲存前先重置成功狀態
    
    await setDoc(docRef, recordData);
    
    setCurrentId(newId);
    window.location.hash = newId;
    await loadRecordsList(user.uid);
    
    // 儲存成功後的邏輯
    setSaveSuccess(true);
    
    // 3 秒後自動切換回原本的文字
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);

  } catch (e) {
    console.error("儲存失敗詳情:", e);
    alert('儲存失敗：' + (e.code === 'permission-denied' ? '資料庫權限不足' : e.message));
  } finally {
    setAutoSaving(false);
  }
};

  const autoSaveRecord = async () => {
    if (!user || !currentId) return; 
    
    const name = recordName || '未命名紀錄';
    const recordData = {
      userId: user.uid,
      name,
      members,
      expenses,
      updatedAt: new Date().toISOString()
    };

    try {
      setAutoSaving(true);
      await setDoc(doc(db, "records", currentId), recordData);
      setRecords(prev => prev.map(r => r.id === currentId ? { ...r, name, updatedAt: recordData.updatedAt } : r));
      setTimeout(() => setAutoSaving(false), 1000);
    } catch (e) {
      console.error('自動儲存失敗', e);
      setAutoSaving(false);
    }
  };

  const deleteRecord = async (id) => {
    try {
      await deleteDoc(doc(db, "records", id));
      const newRecords = records.filter(r => r.id !== id);
      setRecords(newRecords);
      
      if (currentId === id) {
        setCurrentId(null);
        setRecordName('');
        setMembers([{ name: '', bank: '' }]);
        setExpenses([{ payer: '', amount: '', description: '', participants: [] }]);
        setResult(null);
      }
      setDeleteConfirm(null);
    } catch (e) {
      console.error('刪除失敗:', e);
      alert('刪除失敗');
    }
  };

  const createNewRecord = () => {
    setCurrentId(null);
    setRecordName('');
    setMembers([{ name: '', bank: '' }]);
    setExpenses([{ payer: '', amount: '', description: '', participants: [] }]);
    setResult(null);
    window.location.hash = '';
    setView('editor');
  };

  const openRecord = (id) => {
    loadRecord(id);
    setView('editor');
    window.location.hash = id;
  };

  const backToList = () => {
    setView('list');
    window.location.hash = '';
    if (user) loadRecordsList(user.uid);
  };

  const calculate = () => {
    const validMembers = members.filter(m => m.name.trim());
    if (!validMembers.length) return alert('請新增成員');

    const validExpenses = expenses.filter(e => e.payer && e.amount && parseFloat(e.amount) > 0 && e.participants.length);
    if (!validExpenses.length) return alert('請新增有效費用');

    const memberBanks = {};
    validMembers.forEach(m => memberBanks[m.name] = m.bank);

    const balances = {};
    validMembers.forEach(m => balances[m.name] = 0);

    let totalAmount = 0;
    validExpenses.forEach(exp => {
      const amt = parseFloat(exp.amount);
      const pp = amt / exp.participants.length;
      totalAmount += amt;
      if (balances[exp.payer] !== undefined) balances[exp.payer] += amt;
      exp.participants.forEach(p => { if (balances[p] !== undefined) balances[p] -= pp; });
    });

    const creditors = [], debtors = [];
    Object.entries(balances).forEach(([p, b]) => {
      if (b > 0.01) creditors.push({ name: p, amount: b, bank: memberBanks[p] });
      else if (b < -0.01) debtors.push({ name: p, amount: -b, bank: memberBanks[p] });
    });

    const transactions = [];
    for (let i = 0; i < debtors.length; i++) {
      for (let j = 0; j < creditors.length; j++) {
        if (debtors[i].bank && creditors[j].bank && debtors[i].bank === creditors[j].bank) {
          const amt = Math.min(debtors[i].amount, creditors[j].amount);
          if (amt > 0.01) transactions.push({ from: debtors[i].name, to: creditors[j].name, amount: amt, sameBank: true, bank: debtors[i].bank });
          debtors[i].amount -= amt;
          creditors[j].amount -= amt;
        }
      }
    }

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      if (debtors[i].amount < 0.01) { i++; continue; }
      if (creditors[j].amount < 0.01) { j++; continue; }
      const amt = Math.min(debtors[i].amount, creditors[j].amount);
      if (amt > 0.01) transactions.push({ from: debtors[i].name, to: creditors[j].name, amount: amt, sameBank: false });
      debtors[i].amount -= amt;
      creditors[j].amount -= amt;
    }

    setResult({ totalAmount, perPerson: totalAmount / validMembers.length, transactions, balances });
  };

  // 列表視圖
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">費用分攤計算器</h1>
              </div>
              
              {/* 這裡只保留「新增計算」按鈕，其餘登入 UI 已移至頂端導覽列 */}
              <button
                onClick={createNewRecord}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold shadow-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                新增計算
              </button>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-4">所有計算紀錄</h2>
              
              {!user ? (
                /* 當使用者未登入時，顯示簡單的提示 */
                <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-gray-50/50">
                  <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">請由上方導覽列登入以同步雲端紀錄</p>
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">尚無計算紀錄</p>
                  <button onClick={createNewRecord} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
                    <PlusCircle className="w-4 h-4" />
                    建立第一個計算
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => (
                    <div key={record.id} className="flex gap-2">
                      <div
                        className="flex-1 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 transition cursor-pointer bg-white shadow-sm"
                        onClick={() => openRecord(record.id)}
                      >
                        <h3 className="font-semibold text-base text-gray-800 truncate">{record.name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(record.updatedAt).toLocaleDateString('zh-TW', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteConfirm(record);
                        }}
                        className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-600 hover:text-white transition-all self-stretch flex items-center justify-center"
                        title="刪除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 刪除確認 Modal 保持不變 */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2">確認刪除</h3>
                <p className="text-gray-600 mb-6">
                  確定要刪除「<span className="font-semibold">{deleteConfirm.name}</span>」嗎？此操作無法復原。
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition">
                    取消
                  </button>
                  <button onClick={() => deleteRecord(deleteConfirm.id)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-100">
                    確定刪除
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 編輯器視圖
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={backToList} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <Calculator className="w-6 h-6 text-indigo-600" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">編輯計算</h1>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={recordName}
              onChange={(e) => setRecordName(e.target.value)}
              placeholder="紀錄名稱（例：台北兩日遊）"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button
    onClick={saveRecord}
    disabled={autoSaving}
    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
      saveSuccess 
        ? 'bg-green-100 text-green-700 border border-green-500' // 儲存成功後的樣式
        : autoSaving 
          ? 'bg-gray-400 cursor-not-allowed text-white' 
          : 'bg-green-600 hover:bg-green-700 text-white shadow-md active:scale-95'
    }`}
  >
    {autoSaving ? (
      <>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        儲存中...
      </>
    ) : saveSuccess ? (
      <>
        <Check className="w-4 h-4" />
        已更新計算
      </>
    ) : currentId ? (
      <>
        <Save className="w-4 h-4" />
        更新計算紀錄
      </>
    ) : (
      <>
        <Cloud className="w-4 h-4" />
        儲存到雲端
      </>
    )}
  </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-semibold">成員名單</h2>
            </div>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => {
                      const n = [...members]; n[i].name = e.target.value; setMembers(n);
                    }}
                    placeholder={`成員 ${i + 1}`}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                  <div className="flex gap-2">
                    <select
                      value={m.bank}
                      onChange={(e) => {
                        const n = [...members]; n[i].bank = e.target.value; setMembers(n);
                      }}
                      className="flex-1 sm:w-32 px-2 py-2 border rounded-lg text-sm"
                    >
                      <option value="">銀行(可選)</option>
                      {banks.map((b, j) => (<option key={j} value={b}>{b}</option>))}
                    </select>
                    <button
                      onClick={() => members.length > 1 && setMembers(members.filter((_, idx) => idx !== i))}
                      disabled={members.length === 1}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setMembers([...members, { name: '', bank: '' }])} className="mt-2 flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
              <PlusCircle className="w-4 h-4" />
              新增成員
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h2 className="text-base sm:text-lg font-semibold">費用項目</h2>
            </div>
            <div className="space-y-3">
              {expenses.map((exp, i) => (
                <div key={i} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={exp.description}
                      onChange={(e) => {
                        const n = [...expenses]; n[i].description = e.target.value; setExpenses(n);
                      }}
                      placeholder="費用說明"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={exp.payer}
                        onChange={(e) => {
                          const n = [...expenses]; n[i].payer = e.target.value; setExpenses(n);
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">付款人</option>
                        {members.filter(m => m.name.trim()).map((m, j) => (
                          <option key={j} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={exp.amount}
                        onChange={(e) => {
                          const n = [...expenses]; n[i].amount = e.target.value; setExpenses(n);
                        }}
                        placeholder="金額"
                        className="w-full sm:w-28 px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div className="border rounded-lg p-2 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium">參與成員</label>
                        <button
                          type="button"
                          onClick={() => {
                            const n = [...expenses];
                            const vm = members.filter(m => m.name.trim()).map(m => m.name);
                            n[i].participants = n[i].participants.length === vm.length ? [] : vm;
                            setExpenses(n);
                          }}
                          className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                        >
                          {exp.participants.length === members.filter(m => m.name.trim()).length ? '取消' : '全選'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {members.filter(m => m.name.trim()).map((m, j) => (
                          <button
                            key={j}
                            type="button"
                            onClick={() => {
                              const n = [...expenses];
                              n[i].participants = n[i].participants.includes(m.name) ? n[i].participants.filter(p => p !== m.name) : [...n[i].participants, m.name];
                              setExpenses(n);
                            }}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              exp.participants.includes(m.name) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => expenses.length > 1 && setExpenses(expenses.filter((_, idx) => idx !== i))} disabled={expenses.length === 1} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setExpenses([...expenses, { payer: '', amount: '', description: '', participants: [] }])} className="mt-2 flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
              <PlusCircle className="w-4 h-4" />
              新增費用
            </button>
          </div>

          <button onClick={calculate} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 text-sm sm:text-base">
            計算分攤結果
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">分攤結果</h2>
            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">總費用</p>
                <p className="text-lg sm:text-xl font-bold text-indigo-600">NT$ {result.totalAmount.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">每人應付</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">NT$ {result.perPerson.toFixed(0)}</p>
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">轉帳方案</h3>
              {!result.transactions.length ? (
                <p className="text-sm text-gray-600 text-center py-3">已完成分攤，無需轉帳！</p>
              ) : (
                <div className="space-y-2">
                  {result.transactions.map((t, i) => (
                    <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg gap-2 ${t.sameBank ? 'bg-green-50 border-l-4 border-green-500' : 'bg-yellow-50 border-l-4 border-yellow-400'}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm">{t.from}</span>
                        <span className="text-gray-500">→</span>
                        <span className="font-semibold text-sm">{t.to}</span>
                        {t.sameBank && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">{t.bank}</span>}
                        {!t.sameBank && <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">跨行</span>}
                      </div>
                      <span className={`text-base font-bold ${t.sameBank ? 'text-green-700' : 'text-yellow-700'}`}>NT$ {t.amount.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">各成員餘額</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(result.balances).map(([p, b], i) => (
                  <div key={i} className={`p-2 rounded ${b > 0.01 ? 'bg-green-50 border border-green-200' : b < -0.01 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{p}</span>
                      <span className={`font-semibold text-sm ${b > 0.01 ? 'text-green-600' : b < -0.01 ? 'text-red-600' : 'text-gray-600'}`}>
                        {b > 0.01 ? '+' : ''}{b.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">* 正數=應收回，負數=應支付</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


