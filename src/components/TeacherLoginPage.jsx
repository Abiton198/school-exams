// src/components/TeacherLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherList } from '../data/teacherList';

export default function TeacherLoginPage() {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!selectedTeacher || !password) {
      setError('Please select a teacher and enter password.');
      return;
    }

    if (selectedTeacher.password === password) {
      localStorage.setItem('teacherInfo', JSON.stringify(selectedTeacher));
      navigate('/teacher-dashboard');
    } else {
      setError('❌ Incorrect password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-28">
      <div className="bg-white p-6 rounded shadow max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center mb-4">👨‍🏫 Teacher Login</h2>

        {/* Dropdown to select teacher name */}
        <select
          value={selectedTeacher?.name || ''}
          onChange={(e) => {
            const found = teacherList.find(t => t.name === e.target.value);
            setSelectedTeacher(found || null);
            setError('');
            setPassword('');
          }}
          className="w-full mb-3 p-2 border rounded"
        >
          <option value="">Select your name</option>
          {teacherList.map((t, idx) => (
            <option key={idx} value={t.name}>{t.name}</option>
          ))}
        </select>

        {/* Show subject if teacher is selected */}
        {selectedTeacher && (
          <div className="mb-3 text-sm text-gray-700">
            Subject: <span className="font-semibold">{selectedTeacher.subject}</span>
          </div>
        )}

        {/* Password input */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          placeholder="Enter password"
        />

        {/* Error message */}
        {error && <p className="text-red-500 mb-3">{error}</p>}

        {/* Login button */}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    </div>
  );
}
