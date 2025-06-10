import React, { useState, useEffect } from 'react';
import { auth, db } from '../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { teacherCredentials } from '../data/teacherList';

export default function TeacherLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        console.log("✅ Logged in:", user.uid);
        navigate('/teacher-dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async () => {
    setError('');
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const teacher = teacherCredentials.find(t => t.email === email);
      if (!teacher) {
        setError("Email not found in teacher list.");
        return;
      }

      const docRef = doc(db, 'teachers', user.uid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, {
          name: teacher.name,
          subject: teacher.subject
        });
      }

      localStorage.setItem('teacherInfo', JSON.stringify({
        uid: user.uid,
        name: teacher.name,
        subject: teacher.subject
      }));
      localStorage.setItem('teacherLoginTime', Date.now().toString());

      navigate('/teacher-dashboard');
    } catch (err) {
      console.error("Login error:", err.message);
      setError("Invalid email or password.");
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-24">
      <div className="bg-white p-6 rounded shadow max-w-sm w-full">
        <h2 className="text-xl font-bold text-center mb-4">🔐 Teacher Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded mb-2"
        >
          ✅ Login
        </button>

        <button
          onClick={handleCancel}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
        >
          ❌ Cancel
        </button>

        {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
      </div>
    </div>
  );
}
