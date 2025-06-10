import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  const cards = [
    { label: 'Student', color: 'bg-blue-500', route: '/password' },
    { label: 'Teacher', color: 'bg-green-500', route: '/teacher-dashboard' },
    { label: 'Parent', color: 'bg-yellow-400', route: '/parent-dashboard' },
    { label: 'Admin', color: 'bg-red-500', route: '/admin' },
  ];

  return (
    <>
    <div className="w-screen h-screen bg-gray-900 text-white flex items-center justify-center overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl p-4">
    {/* <p className="mt-4 text-xs font-semibold text-center">Comprehensive learning experience without limits</p> */}
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.route)}
            className={`cursor-pointer p-6 rounded-xl text-center text-white shadow-xl transform transition duration-500 hover:scale-105 hover:shadow-2xl ${card.color} animate-none`}
          >
            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center border-4 border-white text-lg font-bold">
              {card.label}
            </div>
            <p className="mt-4 text-xl font-semibold">{card.label} Portal</p>
          </div>
        ))}
      </div>
    </div>
          
    </>
  );
}
