import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Users, DollarSign, Calculator, Save, ArrowLeft, Check } from 'lucide-react';

export default function ExpenseSplitter() {
  const [view, setView] = useState('list'); // 'list' or 'editor'
  const [currentId, setCurrentId] = useState(null);
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([{ name: '', bank: '' }]);
  const [expenses, setExpenses] = useState([{ payer: '', amount: '', description: '', participants: [] }]);
  const [result, setResult] = useState(null);
  const [recordName, setRecordName] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // 儲存要刪除的紀錄ID

  const banks = ['台灣銀行', '土地銀行', '合作金庫', '第一銀行', '華南銀行', '彰化銀行', '兆豐銀行', '台灣企銀', '國泰世華', '中國信託', '玉山銀行', '台北富邦', '國泰銀行', '高雄銀行', '台新銀行', '永豐銀行', '聯邦銀行', '遠東銀行', '元大銀行', '其他'];

  // 自動儲存計時器
  useEffect(() => {
    if (currentId && view === 'editor') {
      const timer = setTimeout(() => {
        autoSaveRecord();
      }, 2000); // 2秒後自動儲存

      return () => clearTimeout(timer);
    }
  }, [members, expenses, recordName, currentId, view]);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      loadRecord(hash);
      setView('editor');
    } else {
      loadRecordsList();
    }
  }, []);

  const loadRecordsList = async () => {
    try {
      const data = await window.storage.get('expense_records_list', true);
      if (data) {
        setRecords(JSON.parse(data.value));
      }
    } catch (e) {
      setRecords([]);
    }
  };

  const loadRecord = async (id) => {
    try {
      const data = await window.storage.get(`expense:${id}`, true);
      if (data) {
        const record = JSON.parse(data.value);
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
    const name = recordName || '未命名紀錄';
    const id = currentId || Date.now().toString(36);
    
    const recordData = {
      name,
      members,
      expenses,
      updatedAt: new Date().toISOString()
    };

    try {
      // 儲存計算資料
      await window.storage.set(`expense:${id}`, JSON.stringify(recordData), true);
      
      // 更新紀錄列表
      const existingIndex = records.findIndex(r => r.id === id);
      let newRecords;
      
      if (existingIndex >= 0) {
        newRecords = [...records];
        newRecords[existingIndex] = { id, name, updatedAt: recordData.updatedAt };
      } else {
        newRecords = [...records, { id, name, updatedAt: recordData.updatedAt }];
      }
      
      await window.storage.set('expense_records_list', JSON.stringify(newRecords), true);
      setRecords(newRecords);
      setCurrentId(id);
      
      // 更新 URL
      window.location.hash = id;
      
      alert('儲存成功！');
    } catch (e) {
      alert('儲存失敗');
    }
  };

  const autoSaveRecord = async () => {
    if (!currentId) return; // 只有已存在的紀錄才自動儲存
    
    const name = recordName || '未命名紀錄';
    
    const recordData = {
      name,
      members,
      expenses,
      updatedAt: new Date().toISOString()
    };

    try {
      setAutoSaving(true);
      
      // 儲存計算資料
      await window.storage.set(`expense:${currentId}`, JSON.stringify(recordData), true);
      
      // 更新紀錄列表
      const existingIndex = records.findIndex(r => r.id === currentId);
      if (existingIndex >= 0) {
        const newRecords = [...records];
        newRecords[existingIndex] = { id: currentId, name, updatedAt: recordData.updatedAt };
        await window.storage.set('expense_records_list', JSON.stringify(newRecords), true);
        setRecords(newRecords);
      }
      
      setTimeout(() => setAutoSaving(false), 1000);
    } catch (e) {
      console.error('自動儲存失敗', e);
      setAutoSaving(false);
    }
  };

  const deleteRecord = async (id) => {
    try {
      // 刪除計算資料
      try {
        await window.storage.delete(`expense:${id}`, true);
      } catch (e) {
        console.log('刪除計算資料時出錯:', e);
      }
      
      // 更新紀錄列表
      const newRecords = records.filter(r => r.id !== id);
      
      await window.storage.set('expense_records_list', JSON.stringify(newRecords), true);
      setRecords(newRecords);
      
      // 如果刪除的是當前正在編輯的紀錄
      if (currentId === id) {
        setCurrentId(null);
        setRecordName('');
        setMembers([{ name: '', bank: '' }]);
        setExpenses([{ payer: '', amount: '', description: '', participants: [] }]);
        setResult(null);
      }
      
      setDeleteConfirm(null); // 關閉確認對話框
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
    loadRecordsList();
  };

  const copyShareUrl = () => {
    // 已移除分享功能
  };

  const fallbackCopy = (text) => {
    // 已移除分享功能
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
              <button
                onClick={createNewRecord}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                新增計算
              </button>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-4">所有計算紀錄</h2>
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
                  {records.map((record) => (
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
                        onClick={(e) => {
                          console.log('刪除按鈕被點擊', record);
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('設定 deleteConfirm 為:', record);
                          setDeleteConfirm(record);
                          console.log('deleteConfirm 狀態已設定');
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition self-stretch flex items-center justify-center"
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

          {/* 刪除確認對話框 - 移到這裡 */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-bold text-gray-800 mb-2">確認刪除</h3>
                <p className="text-gray-600 mb-6">
                  確定要刪除「<span className="font-semibold">{deleteConfirm.name}</span>」嗎？此操作無法復原。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      console.log('點擊取消按鈕');
                      setDeleteConfirm(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      console.log('點擊確定刪除按鈕');
                      deleteRecord(deleteConfirm.id);
                    }}
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
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={backToList}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
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
                      {banks.map((b, j) => (
                        <option key={j} value={b}>{b}</option>
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
                        {members.filter(m => m.name.trim()).map((m, j) => (
                          <option key={j} value={m.name}>{m.name}</option>
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
                        {members.filter(m => m.name.trim()).map((m, j) => (
                          <button
                            key={j}
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
                    <div
                      key={i}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg gap-2 ${
                        t.sameBank ? 'bg-green-50 border-l-4 border-green-500' : 'bg-yellow-50 border-l-4 border-yellow-400'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm">{t.from}</span>
                        <span className="text-gray-500">→</span>
                        <span className="font-semibold text-sm">{t.to}</span>
                        {t.sameBank && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">{t.bank}</span>
                        )}
                        {!t.sameBank && (
                          <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">跨行</span>
                        )}
                      </div>
                      <span className={`text-base font-bold ${t.sameBank ? 'text-green-700' : 'text-yellow-700'}`}>
                        NT$ {t.amount.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">各成員餘額</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(result.balances).map(([p, b], i) => (
                  <div
                    key={i}
                    className={`p-2 rounded ${
                      b > 0.01
                        ? 'bg-green-50 border border-green-200'
                        : b < -0.01
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{p}</span>
                      <span
                        className={`font-semibold text-sm ${
                          b > 0.01 ? 'text-green-600' : b < -0.01 ? 'text-red-600' : 'text-gray-600'
                        }`}
                      >
                        {b > 0.01 ? '+' : ''}
                        {b.toFixed(0)}
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
