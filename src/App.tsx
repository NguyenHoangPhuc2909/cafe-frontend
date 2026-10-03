import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import './App.css';

// Component tạm thời để test layout
const HomePlaceholder = () => (
  <div className="flex items-center justify-center h-64 border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-low">
    <div className="text-center">
      <h2 className="text-headline-md text-primary mb-2">Trang Chủ Đặt Món</h2>
      <p className="text-body-md text-on-surface-variant">Khu vực này sẽ hiển thị các món ăn (ProductCard)</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePlaceholder />} />
          {/* Các trang con khác của Customer sẽ nằm ở đây (VD: /cart) */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
