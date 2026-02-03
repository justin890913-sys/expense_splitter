export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-4">隱私權政策</h1>

        <p className="text-gray-700 leading-7">
          本網站為「費用分攤計算器」工具，提供使用者進行費用紀錄與分攤計算。
          本網站不會要求使用者提供身分證字號、信用卡等敏感資訊。
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">資料儲存方式</h2>
        <p className="text-gray-700 leading-7">
          你在本網站輸入的成員、費用與紀錄資料，會儲存在你的瀏覽器本機（localStorage），
          以便下次開啟時仍能使用。網站伺服器不會接收或保存你的個人資料。
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">第三方服務</h2>
        <p className="text-gray-700 leading-7">
          本網站可能使用 Google 相關服務（例如 Google AdSense）提供廣告內容。
          這些服務可能使用 Cookie 或類似技術來顯示更合適的廣告。
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">聯絡我們</h2>
        <p className="text-gray-700 leading-7">
          若你對本隱私權政策有任何問題，請至「聯絡我們」頁面與我們聯繫。
        </p>
      </div>
    </div>
  );
}
