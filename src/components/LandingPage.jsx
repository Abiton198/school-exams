import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { auth, db } from '../utils/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

export default function LandingPage({ setStudentInfo }) {
  const navigate = useNavigate();

  // ✅ Auto-redirect if already signed in + role exists
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const roles = ['students', 'teachers', 'parents', 'admins'];
        for (const role of roles) {
          if (localStorage.getItem(`${role}Id`)) {
            if (role === 'students') navigate('/exam');
            else if (role === 'teachers') navigate('/teacher-dashboard');
            else if (role === 'parents') navigate('/parent-dashboard');
            else if (role === 'admins') navigate('/admin');
            break;
          }
        }
      }
    });
    return () => unsub();
  }, [navigate]);

  // ✅ Handler for all role clicks
  const handleRoleClick = async (role) => {
    if (role === 'students') {
      try {
        // 🔍 1️⃣ Fetch students
        const snap = await getDocs(collection(db, 'students'));
        const students = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const options = students.reduce((acc, s) => {
          acc[s.id] = `${s.name} (${s.grade})`;
          return acc;
        }, {});

        // 📋 2️⃣ Show dropdown — no need for inline colors, CSS will style buttons
        const { value: selectedId } = await Swal.fire({
          title: 'Select Your Name',
          input: 'select',
          inputOptions: options,
          inputPlaceholder: 'Choose your name...',
          confirmButtonText: 'Continue',
          showCancelButton: true
        });

        if (!selectedId) return;

        const selectedStudent = students.find(s => s.id === selectedId);

        // ✅ 3️⃣ Sign in with Google
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        const user = res.user;

        // ✅ 4️⃣ Save info locally
        localStorage.setItem('studentsId', user.uid);
        localStorage.setItem('studentInfo', JSON.stringify(selectedStudent));
        if (setStudentInfo) setStudentInfo(selectedStudent);

        // ✅ 5️⃣ Redirect
        navigate('/exam');

      } catch (err) {
        console.error(err);
        Swal.fire('Oops!', err.message, 'error');
      }
    } else {
      // ✅ Other roles: Google sign-in only
      const confirm = await Swal.fire({
        title: `${role.charAt(0).toUpperCase() + role.slice(1)} Sign In`,
        text: `Sign in securely with Google.`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Sign In',
        cancelButtonText: 'Cancel'
      });

      if (!confirm.isConfirmed) return;

      try {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        const user = res.user;

        const ref = doc(db, role, user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            name: user.displayName || '',
            email: user.email || '',
            createdAt: new Date().toISOString(),
          });
        }

        localStorage.setItem(`${role}Id`, user.uid);
        localStorage.setItem(`${role}Name`, user.displayName || '');

        if (role === 'teachers') navigate('/teacher-dashboard');
        else if (role === 'parents') navigate('/parent-dashboard');
        else navigate('/admin');

      } catch (err) {
        console.error(err);
        Swal.fire('Oops!', err.message, 'error');
      }
    }
  };

  const cards = [
    { label: 'Student', gradient: 'from-blue-500 to-blue-700', role: 'students', icon: '🎓' },
    { label: 'Teacher', gradient: 'from-green-500 to-green-700', role: 'teachers', icon: '🧑‍🏫' },
    { label: 'Parent', gradient: 'from-yellow-400 to-yellow-600', role: 'parents', icon: '👨‍👩‍👧' },
    { label: 'Admin', gradient: 'from-red-500 to-red-700', role: 'admins', icon: '🛠️' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-24 pb-48 px-4 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 rounded-full blur-3xl animate-pulse"></div>

      <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-center text-white drop-shadow-md">
        🚀 Amic Learning Hub
      </h1>
      <p className="text-lg md:text-xl text-gray-300 mb-12 text-center max-w-xl">
        Secure Google Sign-In for Students, Teachers, Parents & Admins — with name selection for students.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleRoleClick(card.role)}
            className={`cursor-pointer p-6 rounded-2xl text-center shadow-xl transform transition duration-500
              hover:scale-105 hover:shadow-2xl bg-gradient-to-br ${card.gradient} relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition"></div>
            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center border-4 border-white text-4xl shadow-inner bg-white/10">
              {card.icon}
            </div>
            <p className="mt-5 text-2xl font-bold tracking-wide text-white drop-shadow">{card.label} Login</p>
          </div>
        ))}
      </div>
    </div>
  );
}
