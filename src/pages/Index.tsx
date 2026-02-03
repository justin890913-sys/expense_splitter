import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, CheckCircle, Users, Share2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8 bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-2xl py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              分錢不再是煩惱
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              專為旅行、聚餐設計的費用拆分工具。支援雲端儲存、自動計算最優還款路徑，還能記錄銀行資訊。
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => navigate('/calculator')}
                className="rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all hover:scale-105"
              >
                立即開始使用
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 特色介紹 */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">快速、直覺</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              所有你需要的功能，一應俱全
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  雲端儲存
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">透過 Google 登入，隨時隨地存取您的分攤紀錄。</dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  多人參與
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">自由勾選每筆費用的參與者，精確計算每人應付金額。</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
