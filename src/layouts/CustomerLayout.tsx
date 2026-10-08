import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col selection:bg-secondary-fixed selection:text-primary">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto w-full px-margin md:px-space-xl py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;
