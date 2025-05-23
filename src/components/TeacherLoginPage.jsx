import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherList } from '../data/teacherList'; // must be an array of { name, subject, password }

export default function TeacherLoginPage() {
  const [selectedName, setSelectedName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const selectedTeacher = teacherList.find(t => t.name === selectedName);

  const handleLogin = () => {
    if (!selectedTeacher || !password) {
      setError('Please select a name and enter password.');
      return;
    }
  
    if (selectedTeacher.password === password) {
      // ✅ Save teacher info into localStorage
      localStorage.setItem('teacherInfo', JSON.stringify(selectedTeacher));
      localStorage.setItem('teacherLoginTime', Date.now().toString());
      localStorage.setItem('teacherName', selectedTeacher.name);
      localStorage.setItem('teacherSubject', selectedTeacher.subject);
  
      navigate('/teacher-dashboard');
    } else {
      setError('❌ Incorrect password');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-28">
      <div className="bg-white p-6 rounded shadow max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center mb-4">👩‍🏫 Teacher Login</h2>

        <select
          value={selectedName}
          onChange={(e) => {
            setSelectedName(e.target.value);
            setError('');
            setPassword('');
          }}
          className="w-full mb-3 p-2 border rounded"
        >
          <option value="">Select your name</option>
          {teacherList.map((teacher, idx) => (
            <option key={idx} value={teacher.name}>{teacher.name}</option>
          ))}
        </select>

        {selectedTeacher && (
          <p className="mb-3 text-sm text-gray-700">
            Subject: <strong>{selectedTeacher.subject}</strong>
          </p>
        )}

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          placeholder="Enter password"
        />

        {error && <p className="text-red-500 mb-3">{error}</p>}

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
