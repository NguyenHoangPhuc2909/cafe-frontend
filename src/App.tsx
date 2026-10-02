import { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-amber-700 mb-4">
          Cafe Frontend ☕
        </h1>
        <p className="text-gray-600 mb-6">
          Dự án đã được cấu hình thành công với React, Vite và Tailwind CSS v4!
        </p>
        <button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
          Bắt đầu Code thôi!
        </button>
      </div>
    </div>
  )
}

export default App
