import React, { useState } from 'react';
import { auth } from '../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function ParentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please fill in both fields.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/parent-dashboard');
    } catch (err) {
      console.error('Login error:', err.message);
      setErrorMsg('Login failed. If you haven’t linked your account, please do so first.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow max-w-sm w-full relative">
        <h2 className="text-xl font-bold mb-4 text-center">Parent Login</h2>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password with toggle */}
        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border rounded pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2 text-sm text-gray-600"
          >
            {showPassword ? '🙈' : '👁'}
          </button>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white p-2 rounded font-semibold mb-3"
        >
          Login
        </button>

        {/* Link to Child Button */}
        <button
          onClick={() => navigate('/parent-link')}
          className="w-full text-sm text-blue-600 underline hover:text-blue-800"
        >
          Link to Child (First Time Setup)
        </button>

        {/* Error Message */}
        {errorMsg && (
          <p className="mt-3 text-red-600 text-sm text-center">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
