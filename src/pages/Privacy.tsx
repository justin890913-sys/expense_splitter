export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">隱私權政策</h1>

        <div className="space-y-6 text-gray-700 leading-7">
          <section>
            <p>
              本網站為「費用分攤計算器」工具（以下簡稱「本服務」），提供使用者進行費用紀錄與分攤計算。
              我們非常重視您的隱私，本服務絕不會要求或儲存您的身分證字號、信用卡卡號或銀行帳戶密碼等敏感資訊。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-indigo-700 mb-2">1. 資料蒐集與用途</h2>
            <ul className="list-disc ml-5 space-y-2">
              <li>
                <strong>登入資訊：</strong> 當您使用 Google 帳號登入時，我們僅透過 Google Firebase 獲取您的基本公開資訊（如顯示名稱、電子郵件、個人頭像），僅用於識別使用者身分以提供跨裝置同步功能。
              </li>
              <li>
                <strong>計算紀錄：</strong> 您所輸入的成員名稱、費用說明、金額及銀行名稱，是為了完成計算分攤與紀錄保存之目的。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-indigo-700 mb-2">2. 資料儲存方式</h2>
            <ul className="list-disc ml-5 space-y-2">
              <li>
                <strong>未登入狀態：</strong> 資料僅儲存於您的瀏覽器本機快取（localStorage），清除瀏覽器資料後紀錄將會消失。
              </li>
              <li>
                <strong>已登入狀態：</strong> 為了提供雲端備份與同步功能，您的紀錄會加密儲存於 Google Firebase 雲端資料庫（Firestore）。我們僅透過您的帳戶 UID 進行資料區隔，確保只有您本人可以存取自己的紀錄。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-indigo-700 mb-2">3. 第三方服務與安全</h2>
            <p>
              本服務使用 Google Firebase 作為技術供應商。本網站可能包含 Google 相關服務（如 Google AdSense）之廣告或分析內容，這些服務可能使用 Cookie 技術來提供更合適的體驗。我們承諾不會將您的個人資訊出售或提供給不相關的第三方團體。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-indigo-700 mb-2">4. 聯絡我們</h2>
            <p>
              若您對本隱私權政策、資料處理方式或有任何疑問，請至「聯絡我們」頁面與我們聯繫。
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-gray-400">
          最後更新日期：2026年
        </div>
      </div>
    </div>
  );
}

