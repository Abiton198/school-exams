import React, { useState, useEffect } from 'react';
import { auth, db } from '../utils/firebase';
import { signInAnonymously } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { teacherCredentials } from '../data/teacherList';

export default function TeacherLoginPage() {
  const [loginMode, setLoginMode] = useState('email'); // 'email' | 'name'
  const [email, setEmail] = useState('');
  const [firebasePassword, setFirebasePassword] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("✅ Logged in as:", user.uid);
        navigate('/teacher-dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleEmailLogin = async () => {
    setError('');
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, firebasePassword);
      console.log("✅ Firebase login successful:", user.uid);
      navigate('/teacher-dashboard');
    } catch (err) {
      console.error("Firebase login error:", err.message);
      setError('Invalid email or password.');
    }
  };


const handleNameLogin = async () => {
  setError('');
  const teacher = teacherCredentials.find(t => t.name === selectedName);

  if (!teacher) {
    setError("Please select a teacher.");
    return;
  }

  if (teacher.password !== customPassword) {
    setError("Incorrect password.");
    return;
  }

  try {
    // ✅ Sign in anonymously to get a Firebase user
    const { user } = await signInAnonymously(auth);

    // ✅ Write teacher data to Firestore (if needed)
    await setDoc(doc(db, 'teachers', user.uid), {
      name: teacher.name,
      subject: teacher.subject,
      manual: true,
    }, { merge: true });

    // ✅ Save to localStorage for UI
    localStorage.setItem('teacherInfo', JSON.stringify({
      name: teacher.name,
      subject: teacher.subject,
      uid: user.uid,
      loginType: 'manual'
    }));

    navigate('/teacher-dashboard');
  } catch (err) {
    console.error("Anonymous + manual login failed:", err.message);
    setError("Login failed. Try again.");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-20">
      <div className="bg-white p-6 rounded shadow max-w-sm w-full">
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setLoginMode('email')}
            className={`px-4 py-2 rounded-l ${loginMode === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Email Login
          </button>
          <button
            onClick={() => setLoginMode('name')}
            className={`px-4 py-2 rounded-r ${loginMode === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Name Login
          </button>
        </div>

        {loginMode === 'email' && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-2 p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={firebasePassword}
              onChange={(e) => setFirebasePassword(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />
            <button
              onClick={handleEmailLogin}
              className="w-full bg-blue-600 text-white py-2 rounded mb-2"
            >
              Login with Email
            </button>
          </>
        )}

        {loginMode === 'name' && (
          <>
            <select
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              className="w-full mb-2 p-2 border rounded"
            >
              <option value="">Select your name</option>
              {teacherCredentials.map((t, idx) => (
                <option key={idx} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              type="password"
              placeholder="Password"
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />
            <button
              onClick={handleNameLogin}
              className="w-full bg-green-600 text-white py-2 rounded mb-2"
            >
              Login with Name
            </button>
          </>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
