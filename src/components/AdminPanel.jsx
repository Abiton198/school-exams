// src/components/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');

  // 🔐 Ask for admin login if not already stored
  useEffect(() => {
    const savedAdmin = localStorage.getItem('adminName');

    if (savedAdmin) {
      setAdminName(savedAdmin);
    } else {
      Swal.fire({
        title: 'Admin Login',
        text: 'Enter admin password to access the panel',
        input: 'password',
        inputPlaceholder: 'Enter password',
        confirmButtonText: 'Login',
        allowOutsideClick: false,
        preConfirm: (password) => {
          if (password === 'admin123') {
            return Swal.fire({
              title: 'Enter Admin Name',
              input: 'text',
              inputPlaceholder: 'e.g. Mr. Nkosi',
              inputValidator: (value) => {
                if (!value) return 'Name is required';
              }
            }).then((res) => {
              if (res.value) {
                localStorage.setItem('adminName', res.value);
                setAdminName(res.value);
              }
            });
          } else {
            Swal.showValidationMessage('❌ Incorrect password');
            return false;
          }
        }
      });
    }
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout'
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem('adminName');
        setAdminName('');
        window.location.reload();
      }
    });
  };

  const sections = [
    {
      title: 'Teacher Dashboard',
      description: 'Add exams and manage questions.',
      path: '/teacher-dashboard',
      icon: '🧑‍🏫',
      color: 'bg-blue-100'
    },
    {
      title: 'All Results',
      description: 'View and mark student exams.',
      path: '/all-results',
      icon: '📊',
      color: 'bg-green-100'
    },
    {
      title: 'Exam Manager',
      description: 'Edit or delete created exams.',
      path: '/exam-manager',
      icon: '🗂️',
      color: 'bg-yellow-100'
    }
  ];

  if (!adminName) return <div className="pt-28 text-center text-gray-500">🔐 Authenticating admin...</div>;

  return (
    <div className="min-h-screen pt-28 px-4 bg-gray-50">
      <div className="flex justify-between items-center max-w-6xl mx-auto mb-8 px-2">
        <h1 className="text-2xl font-bold text-blue-700">👋 Welcome, {adminName}</h1>
        <button
          onClick={handleLogout}
          className="text-red-600 font-semibold hover:underline"
        >
          Logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {sections.map((section, i) => (
          <div
            key={i}
            onClick={() => navigate(section.path)}
            className={`cursor-pointer rounded-lg shadow-md p-6 transition transform hover:scale-105 ${section.color}`}
          >
            <div className="text-4xl mb-3 text-center">{section.icon}</div>
            <h3 className="text-lg font-semibold text-center text-gray-800">{section.title}</h3>
            <p className="text-sm text-gray-600 mt-2 text-center">{section.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
