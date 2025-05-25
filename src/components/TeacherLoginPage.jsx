import React, { useState, useEffect } from 'react';
import { auth, db } from '../utils/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function TeacherLoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) navigate('/teacher-dashboard');
    });
    return () => unsubscribe();
  }, []);
  
  // Sign Up
  const handleSignup = async () => {
    if (!name || !subject || !email || !password || password.length < 6) {
      setError("All fields are required. Password must be at least 6 characters.");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, 'teachers', uid), { name, subject });

      localStorage.setItem('teacherName', name);
      localStorage.setItem('teacherSubject', subject);

      navigate('/teacher-dashboard');
    } catch (err) {
      console.error("Signup Error:", err.code, err.message);
      setError(`${err.code.replace("auth/", "").replaceAll("-", " ")}: ${err.message}`);
    }
  };
  

  // Login

async function handleLogin() {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const teacherRef = doc(db, 'teachers', user.uid);

    let snap;
    try {
      snap = await getDoc(teacherRef);
    } catch (err) {
      if (err.code === 'permission-denied') {
        // Maybe the doc didn't exist yet — create a blank one
        await setDoc(teacherRef, { name: '', subject: '' });
        snap = await getDoc(teacherRef);
      } else {
        throw err; // some other error
      }
    }

    if (!snap.exists()) {
      // If it still doesn't exist, handle it
      setError('Teacher profile not found. Please sign up first.');
      return;
    }

    const info = snap.data();
    localStorage.setItem('teacherInfo', JSON.stringify(info));
    localStorage.setItem('teacherLoginTime', Date.now().toString());
    navigate('/teacher-dashboard');
  } catch (err) {
    console.error('Login Error:', err.code, err.message);
    setError(err.message);
  }
}

  // Reset Password
  const handleReset = async () => {
    if (!email) {
      setError("Please enter your email to receive reset instructions.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent.');
      setMode('login');
    } catch (err) {
      setError(err.message);
    }
  };

  // Enter to submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (mode === 'signup') handleSignup();
      else if (mode === 'login') handleLogin();
      else if (mode === 'reset') handleReset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-24">
      <div className="bg-white p-6 rounded shadow max-w-sm w-full">
        <h2 className="text-xl font-bold text-center mb-4">
          {mode === 'signup' ? '👩‍🏫 Sign Up' : mode === 'reset' ? '🔒 Reset Password' : '👨‍🏫 Login'}
        </h2>

        {mode === 'signup' && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full mb-2 p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full mb-2 p-2 border rounded"
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full mb-2 p-2 border rounded"
        />

        {mode !== 'reset' && (
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full mb-2 p-2 border rounded pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        {mode === 'signup' && (
          <button
            onClick={handleSignup}
            className="w-full bg-green-600 text-white py-2 rounded mb-2"
          >
            Create Account
          </button>
        )}

        {mode === 'login' && (
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded mb-2"
          >
            Login
          </button>
        )}

        {mode === 'reset' && (
          <button
            onClick={handleReset}
            className="w-full bg-purple-600 text-white py-2 rounded mb-2"
          >
            Send Reset Email
          </button>
        )}

        <div className="text-sm text-center">
          {mode === 'login' && (
            <>
              <p>
                Don’t have an account?{' '}
                <button className="text-blue-600" onClick={() => setMode('signup')}>
                  Sign Up
                </button>
              </p>
              <p>
                <button className="text-purple-600 mt-1" onClick={() => setMode('reset')}>
                  Forgot Password?
                </button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button className="text-blue-600" onClick={() => setMode('login')}>
                Login
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <p>
              Back to{' '}
              <button className="text-blue-600" onClick={() => setMode('login')}>
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
