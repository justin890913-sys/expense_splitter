import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Users, DollarSign, Calculator, Save, ArrowLeft, Check, LogOut, Cloud } from 'lucide-react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, getDocs, where, deleteDoc, orderBy } from 'firebase/firestore';

type ViewMode = 'list' | 'editor';

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
  const [view, setView] = useState<ViewMode>('list');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [members, setMembers] = useState<Member[]>([{ name: '', bank: '' }]);
  const [expenses, setExpenses] = useState<Expense[]>([{ payer: '', amount: '', description: '', participants: [] }]);
  const [result, setResult] = useState<ResultData | null>(null);
  const [recordName, setRecordName] = useState<string>('');
  const [autoSaving, setAutoSaving] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<RecordListItem | null>(null);

  const banks = [
    '台灣銀行', '土地銀行', '合作金庫', '第一銀行', '華南銀行', '彰化銀行',
    '兆豐銀行', '台灣企銀', '國泰世華', '中國信託', '玉山銀行', '台北富邦',
    '高雄銀行', '台新銀行', '永豐銀行', '聯邦銀行', '遠東銀行', '元大銀行', '其他'
  ];

  // 監聽登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadRecordsFromCloud(currentUser.uid);
      } else {
        setRecords([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Google 登入
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('登入失敗', error);
      alert('登入失敗，請稍後再試');
    }
  };

  // 登出
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('list');
      setCurrentId(null);
      setRecordName('');
      setMembers([{ name: '', bank: '' }]);
      setExpenses([{ payer: '', amount: '', description: '', participants: [] }]);
      setResult(null);
    } catch (error) {
      console.error('登出失敗', error);
    }
  };

  // 從雲端載入紀錄列表
  const loadRecordsFromCloud = async (uid: string) => {
    try {
      const q = query(
        collection(db, 'records'),
        where('userId', '==', uid),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const list: RecordListItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({ id: docSnap.id, name: data.name, updatedAt: data.updatedAt });
      });
      setRecords(list);
    } catch (e) {
      console.error('載入列表失敗', e);
    }
  };

  // 開啟單筆紀錄
  const openRecord = async (id: string) => {
    setCurrentId(id);
    const docRef = doc(db, 'records', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as RecordData;
      setRecordName(data.name);
      setMembers(data.members || [{ name: '', bank: '' }]);
      setExpenses(data.expenses || [{ payer: '', amount: '', description: '', participants: [] }]);
      setResult(null);
      setView('editor');
      window.location.hash = id;
    }
  };

  // 建立新紀錄
  const createNewRecord = () => {
    setCurrentId(null);
    setRecordName('');
    setMembers([{ name: '', bank: '' }]);
    setExpenses([{ payer: '', amount: '', description: '', participants: [] }]);
    setResult(null);
    window.location.hash = '';
    setView('editor');
  };

  // 返回列表
  const backToList = () => {
    setView('list');
    window.location.hash = '';
    if (user) {
      loadRecordsFromCloud(user.uid);
    }
  };

  // 儲存到雲端
  const saveToCloud = async (isAuto = false) => {
    if (!user) return alert('請先登入');

    if (!isAuto) setAutoSaving(true);
    
    const id = currentId || Date.now().toString(36);
    const recordData: RecordData = {
      userId: user.uid,
      name: recordName || '未命名紀錄',
      members,
      expenses,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'records', id), recordData);
      setCurrentId(id);
      window.location.hash = id;
      
      if (user) {
        await loadRecordsFromCloud(user.uid);
      }
      
      if (!isAuto) {
        alert('儲存成功！');
      }
    } catch (e) {
      console.error('儲存失敗', e);
      if (!isAuto) {
        alert('儲存失敗');
      }
    } finally {
      if (!isAuto) {
        setAutoSaving(false);
      }
    }
  };

  // 自動儲存
  useEffect(() => {
    if (user && currentId && view === 'editor') {
      const timer = setTimeout(() => {
        saveToCloud(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [members, expenses, recordName, user, currentId, view]);

  // 刪除紀錄
  const deleteRecordFromCloud = async (id: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'records', id));
      const newRecords = records.filter(r => r.id !== id);
      setRecords(newRecords);
      setDeleteConfirm(null);
      
      if (currentId === id) {
        backToList();
      }
    } catch (e) {
      console.error('刪除失敗', e);
      alert('刪除失敗');
    }
  };

  // 計算邏輯
  const calculate = () => {
    const validMembers = members.filter(m => m.name.trim());
    if (!validMembers.length) return alert('請新增成員');

    const validExpenses = expenses.filter(e => e.payer && e.amount && parseFloat(e.amount) > 0 && e.participants.length);
    if (!validExpenses.length) return alert('請新增有效費用');

    const memberBanks: Record<string, string> = {};
    validMembers.forEach(m => memberBanks[m.name] = m.bank);

    const balances: Record<string, number> = {};
    validMembers.forEach(m => balances[m.name] = 0);

    let totalAmount = 0;
    validExpenses.forEach(exp => {
      const amt = parseFloat(exp.amount);
      const pp = amt / exp.participants.length;
      totalAmount += amt;
      if (balances[exp.payer] !== undefined) balances[exp.payer] += amt;
      exp.participants.forEach(p => {
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
    
    // 優先匹配同銀行
    for (let i = 0; i < debtors.length; i++) {
      for (let j = 0; j < creditors.length; j++) {
        if (debtors[i].bank && creditors[j].bank && debtors[i].bank === creditors[j].bank) {
          const amt = Math.min(debtors[i].amount, creditors[j].amount);
          if (amt > 0.01) {
            transactions.push({
              from: debtors[i].name,
              to: creditors[j].name,
              amount: amt,
              sameBank: true,
              bank: debtors[i].bank
            });
          }
          debtors[i].amount -= amt;
          creditors[j].amount -= amt;
        }
      }
    }

    // 處理剩餘跨行交易
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      if (debtors[i].amount < 0.01) {
        i++;
        continue;
      }
      if (creditors[j].amount < 0.01) {
        j++;
        continue;
      }
      
      const amt = Math.min(debtors[i].amount, creditors[j].amount);
      if (amt > 0.01) {
        transactions.push({
          from: debtors[i].name,
          to: creditors[j].name,
          amount: amt,
          sameBank: false
        });
      }
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
          {/* 頂部導覽 */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">費用分攤計算器</h1>
              </div>
              
              {user ? (
                <div className="flex items-center gap-3">
                  <img 
                    src={user.photoURL || ''} 
                    alt="User" 
                    className="w-8 h-8 rounded-full border border-indigo-200"
                  />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">登出</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                  <span className="text-sm font-semibold text-gray-700">使用 Google 登入</span>
                </button>
              )}
            </div>
          </div>

          {/* 主要內容 */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            {!user ? (
              <div className="text-center py-12">
                <Cloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">雲端同步功能</h2>
                <p className="text-gray-600 mb-6">登入後即可將資料備份至雲端，隨時隨地存取</p>
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  使用 Google 登入
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-700">我的計算紀錄</h2>
                  <button
                    onClick={createNewRecord}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    新增計算
                  </button>
                </div>

                {records.length === 0 ? (
                  <div className="text-center py-12">
                    <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">尚無計算紀錄</p>
                    <button
                      onClick={createNewRecord}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      <PlusCircle className="w-4 h-4" />
                      建立第一個計算
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {records.map(record => (
                      <div key={record.id} className="flex gap-2">
                        <div
                          className="flex-1 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 transition cursor-pointer"
                          onClick={() => openRecord(record.id)}
                        >
                          <h3 className="font-semibold text-base text-gray-800 truncate">{record.name}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(record.updatedAt).toLocaleDateString('zh-TW', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => setDeleteConfirm(record)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition self-stretch flex items-center justify-center"
                          title="刪除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 刪除確認對話框 */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-bold text-gray-800 mb-2">確認刪除</h3>
                <p className="text-gray-600 mb-6">
                  確定要刪除「<span className="font-semibold">{deleteConfirm.name}</span>」嗎？此操作無法復原。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => deleteRecordFromCloud(deleteConfirm.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
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
        {/* 頂部導航 */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={backToList}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            {currentId && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <Cloud className="w-3 h-3" />
                <span>已同步</span>
              </div>
            )}
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
              onClick={() => saveToCloud(false)}
              disabled={autoSaving}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
                autoSaving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {autoSaving ? (
                <Save className="w-4 h-4" />
              ) : currentId ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {autoSaving ? '儲存中...' : currentId ? '已儲存計算' : '儲存計算'}
            </button>
          </div>
        </div>

        {/* 計算器主體 */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4">
          {/* 成員設定 */}
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
                      const n = [...members];
                      n[i].name = e.target.value;
                      setMembers(n);
                    }}
                    placeholder={`成員 ${i + 1}`}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                  <div className="flex gap-2">
                    <select
                      value={m.bank}
                      onChange={(e) => {
                        const n = [...members];
                        n[i].bank = e.target.value;
                        setMembers(n);
                      }}
                      className="flex-1 sm:w-32 px-2 py-2 border rounded-lg text-sm"
                    >
                      <option value="">銀行(可選)</option>
                      {banks.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
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
            <button
              onClick={() => setMembers([...members, { name: '', bank: '' }])}
              className="mt-2 flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              新增成員
            </button>
          </div>

          {/* 費用設定 */}
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
                        const n = [...expenses];
                        n[i].description = e.target.value;
                        setExpenses(n);
                      }}
                      placeholder="費用說明"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={exp.payer}
                        onChange={(e) => {
                          const n = [...expenses];
                          n[i].payer = e.target.value;
                          setExpenses(n);
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">付款人</option>
                        {members.filter(m => m.name.trim()).map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={exp.amount}
                        onChange={(e) => {
                          const n = [...expenses];
                          n[i].amount = e.target.value;
                          setExpenses(n);
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
                        {members.filter(m => m.name.trim()).map(m => (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => {
                              const n = [...expenses];
                              n[i].participants = n[i].participants.includes(m.name)
                                ? n[i].participants.filter(p => p !== m.name)
                                : [...n[i].participants, m.name];
                              setExpenses(n);
                            }}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              exp.participants.includes(m.name)
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                      {exp.participants.length > 0 && exp.amount && (
                        <p className="text-xs text-gray-500 mt-2">
                          已選 {exp.participants.length} 人 (每人 NT$ {(parseFloat(exp.amount) / exp.participants.length).toFixed(0)})
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => expenses.length > 1 && setExpenses(expenses.filter((_, idx) => idx !== i))}
                    disabled={expenses.length === 1}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setExpenses([...expenses, { payer: '', amount: '', description: '', participants: [] }])}
              className="mt-2 flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              新增費用
            </button>
          </div>

          <button
            onClick={calculate}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 text-sm sm:text-base"
          >
            計算分攤結果
          </button>
        </div>

        {/* 結果顯示 */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">分攤結果</h2>
            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">總費用</p>
                <p className="text-lg sm:text-xl font-bold text-indigo-600">NT$ {result.totalAmount.toFixed(0)}</p>
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


