import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import './App.css';
import CustomerMenu from './pages/Customer/CustomerMenu';
import CartPage from './pages/Customer/CartPage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<CustomerMenu />} />
          <Route path="cart" element={<CartPage />} />
          {/* Các trang con khác của Customer sẽ nằm ở đây (VD: /cart) */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
