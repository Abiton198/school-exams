// TeacherSignupPage.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { useNavigate } from 'react-router-dom';

export default function TeacherSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'teachers', uid), {
        name,
        subject
      });

      localStorage.setItem('teacherInfo', JSON.stringify({ name, subject }));
      localStorage.setItem('teacherUid', uid);

      navigate('/teacher-dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-24">
      <div className="bg-white p-6 rounded shadow max-w-sm w-full">
        <h2 className="text-xl font-bold text-center mb-4">👩‍🏫 Teacher Sign Up</h2>

        <input type="text" placeholder="Full Name" className="w-full mb-3 p-2 border rounded"
          value={name} onChange={(e) => setName(e.target.value)} />
        <input type="text" placeholder="Subject" className="w-full mb-3 p-2 border rounded"
          value={subject} onChange={(e) => setSubject(e.target.value)} />
        <input type="email" placeholder="Email" className="w-full mb-3 p-2 border rounded"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" className="w-full mb-3 p-2 border rounded"
          value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <button onClick={handleSignup} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
          Sign Up
        </button>
      </div>
    </div>
  );
}
