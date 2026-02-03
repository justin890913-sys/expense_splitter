export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-4">關於這個工具</h1>
        <p className="text-gray-700 leading-7">
          費用分攤計算器用來協助旅遊、聚餐、活動等情境快速計算每個人該付多少，
          並提供最佳化的轉帳方案（優先同銀行轉帳）。
        </p>
      </div>
    </div>
  );
}
