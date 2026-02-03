import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Calculator, Home, Info, Menu } from 'lucide-react';
import Index from './pages/Index';
import CalculatorPage from './pages/Calculator';
import About from './pages/About';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* 全域導覽列 */}
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              {/* Logo 區域 */}
              <div className="flex items-center gap-2">
                <Calculator className="w-6 h-6 text-indigo-600" />
                <span className="font-bold text-xl text-gray-800 tracking-tight">分分計較</span>
              </div>

              {/* 連結區域 - 桌面版 */}
              <div className="hidden md:flex items-center gap-6">
                <Link to="/" className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 font-medium transition">
                  <Home className="w-4 h-4" /> 首頁
                </Link>
                <Link to="/calculator" className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 font-medium transition">
                  <Calculator className="w-4 h-4" /> 計算器
                </Link>
                <Link to="/about" className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 font-medium transition">
                  <Info className="w-4 h-4" /> 關於我們
                </Link>
              </div>

              {/* 行動版選單按鈕 - 簡易版 */}
              <div className="md:hidden">
                <Menu className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
          
          {/* 行動版副導覽 (方便手機點擊) */}
          <div className="md:hidden flex border-t border-gray-100 bg-white">
            <Link to="/" className="flex-1 py-3 text-center text-xs font-bold text-gray-600 border-r border-gray-100">首頁</Link>
            <Link to="/calculator" className="flex-1 py-3 text-center text-xs font-bold text-gray-600 border-r border-gray-100">計算器</Link>
            <Link to="/about" className="flex-1 py-3 text-center text-xs font-bold text-gray-600">關於</Link>
          </div>
        </nav>

        {/* 頁面內容 */}
        <main className="transition-all duration-300">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
