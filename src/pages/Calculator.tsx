import React from 'react';
import ExpenseSplitter from '../components/ExpenseSplitter';

const CalculatorPage = () => {
  return (
    <div className="pt-4 pb-12">
      <div className="max-w-4xl mx-auto px-4 mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          費用分攤
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          輕鬆計算旅費、聚餐與日常開銷
        </p>
      </div>
      <ExpenseSplitter />
    </div>
  );
};

export default CalculatorPage;
