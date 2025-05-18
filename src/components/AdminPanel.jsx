// src/components/AdminPanel.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Create Exam",
      description: "Add and manage questions for all grades.",
      icon: "📝",
      path: "/teacher-dashboard",
    },
    {
      title: "All Results",
      description: "View and mark student results.",
      icon: "📊",
      path: "/all-results",
    },
    {
      title: "Student Results",
      description: "Quick view of individual student performance.",
      icon: "🧑‍🎓",
      path: "/results",
    },
    {
      title: "Exam Manager",
      description: "View, edit or delete exams created by teachers.",
      icon: "🗂️",
      path: "/exam-manager",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pt-28 px-4">
      <h1 className="text-3xl font-bold text-center mb-10 text-blue-800">Admin Control Panel</h1>
      <div className="max-w-6xl mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition cursor-pointer border hover:border-blue-400"
            onClick={() => navigate(card.path)}
          >
            <div className="text-5xl mb-4 text-blue-600 text-center">{card.icon}</div>
            <h3 className="text-xl font-semibold text-center mb-2">{card.title}</h3>
            <p className="text-sm text-gray-600 text-center">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
