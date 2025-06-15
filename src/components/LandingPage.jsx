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
  query,
  where,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

export default function LandingPage({ setStudentInfo }) {
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const roles = ['students', 'teachers', 'parents', 'admins'];
        for (const role of roles) {
          if (localStorage.getItem(`${role}Id`)) {
            if (role === 'students') navigate('/exam');
            else if (role === 'teachers') navigate('/teacher-dashboard');
            else if (role === 'parents') navigate('/parent-dashboard');
            else navigate('/admin');
            break;
          }
        }
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleStudentClick = async () => {
    const { value: isNew } = await Swal.fire({
      title: 'Student Access',
      text: 'Are you a new student?',
      icon: 'question',
      showDenyButton: true,
      confirmButtonText: '✅ New Student',
      denyButtonText: '🔑 Existing Student',
      confirmButtonColor: '#22c55e',
      denyButtonColor: '#ef4444',
    });

    if (isNew) {
      // ✅ New student flow
      const { value: name } = await Swal.fire({
        title: 'Enter Full Name',
        input: 'text',
        inputPlaceholder: 'John Doe',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#ef4444',
      });
      if (!name) return;

      // Check if name already exists
      const exists = await getDocs(query(collection(db, 'students'), where('name', '==', name)));
      if (!exists.empty) {
        await Swal.fire('Already Registered', 'This name is already registered. Use Existing Student.', 'info');
        return;
      }

      // Grade
      const { value: grade } = await Swal.fire({
        title: 'Select Grade',
        input: 'select',
        inputOptions: { '10': 'Grade 10', '11': 'Grade 11', '12': 'Grade 12' },
        inputPlaceholder: 'Choose grade',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#ef4444',
      });
      if (!grade) return;

      // Subjects checkboxes
      const { value: subjects } = await Swal.fire({
        title: 'Select Subjects',
        html: `
          <div style="text-align:left;">
            <label><input type="checkbox" value="Mathematics"> Mathematics</label><br/>
            <label><input type="checkbox" value="English"> English</label><br/>
            <label><input type="checkbox" value="CAT"> CAT</label><br/>
            <label><input type="checkbox" value="LO"> LO</label><br/>
            <label><input type="checkbox" value="History"> History</label><br/>
            <label><input type="checkbox" value="Geography"> Geography</label><br/>
            <label><input type="checkbox" value="Physics"> Physics</label><br/>
            <label><input type="checkbox" value="Business"> Business</label><br/>
            <label><input type="checkbox" value="Creative Arts"> Creative Arts</label><br/>
            <label><input type="checkbox" value="Xhosa"> Xhosa</label><br/>
            <label><input type="checkbox" value="Afrikaans"> Afrikaans</label>
          </div>
        `,
        preConfirm: () => {
          const selected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
          if (selected.length === 0) Swal.showValidationMessage('Please select at least one subject.');
          return selected;
        },
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#ef4444',
      });
      if (!subjects) return;

      // ✅ Sign in and save
      handleStudentSignIn(name, false, grade, subjects);

    } else if (isNew === false) {
      // ✅ Existing student flow
      const { value: grade } = await Swal.fire({
        title: 'Select Your Grade',
        input: 'select',
        inputOptions: { '10': 'Grade 10', '11': 'Grade 11', '12': 'Grade 12' },
        inputPlaceholder: 'Your grade',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#ef4444',
      });
      if (!grade) return;

      const snap = await getDocs(query(collection(db, 'students'), where('grade', '==', `Grade ${grade}`)));
      const list = snap.docs.map(d => d.data());
      if (list.length === 0) {
        return Swal.fire('No Students', `No students found for Grade ${grade}.`, 'info');
      }

      const options = list.reduce((acc, s) => {
        acc[s.name] = s.name;
        return acc;
      }, {});

      const { value: name } = await Swal.fire({
        title: 'Select Your Name',
        input: 'select',
        inputOptions: options,
        inputPlaceholder: 'Choose your name',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#ef4444',
      });
      if (!name) return;

      handleStudentSignIn(name, true);
    }
  };

  const handleStudentSignIn = async (name, isExisting, grade = null, subjects = null) => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      let studentDoc;
      const snap = await getDocs(query(collection(db, 'students'), where('name', '==', name)));
      if (!snap.empty) studentDoc = snap.docs[0];

      if (isExisting && studentDoc) {
        const student = studentDoc.data();
        if (student.email && student.email !== user.email) {
          return Swal.fire('Email Mismatch', `This student uses ${student.email}. Sign in with that email.`, 'error');
        }
        localStorage.setItem('studentsId', user.uid);
        localStorage.setItem('studentInfo', JSON.stringify(student));
        if (setStudentInfo) setStudentInfo(student);
        navigate('/exam');
      } else if (!isExisting) {
        const studentRef = doc(collection(db, 'students'));
        await setDoc(studentRef, {
          name,
          grade: `Grade ${grade}`,
          subjects,
          email: user.email,
          createdAt: new Date().toISOString(),
        });
        const student = { name, grade: `Grade ${grade}`, subjects, email: user.email };
        localStorage.setItem('studentsId', user.uid);
        localStorage.setItem('studentInfo', JSON.stringify(student));
        if (setStudentInfo) setStudentInfo(student);
        navigate('/exam');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Oops!', err.message, 'error');
    }
  };

  const handleRoleClick = async (role) => {
    const confirm = await Swal.fire({
      title: `${role.charAt(0).toUpperCase() + role.slice(1)} Sign In`,
      text: 'Sign in securely with Google.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sign In',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#ef4444',
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
  };

  const cards = [
    { label: 'Student', gradient: 'from-blue-500 to-blue-700', onClick: handleStudentClick, icon: '🎓' },
    { label: 'Teacher', gradient: 'from-green-500 to-green-700', role: 'teachers', icon: '🧑‍🏫' },
    { label: 'Parent', gradient: 'from-yellow-400 to-yellow-600', role: 'parents', icon: '👨‍👩‍👧' },
    { label: 'Admin', gradient: 'from-red-500 to-red-700', role: 'admins', icon: '🛠️' },
  ];

    return (
      <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* 🔵 Background Glow */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 rounded-full blur-3xl animate-pulse"></div>
    
        {/* ✅ Add top padding equal to navbar height */}
        <div className="w-full max-w-6xl pt-24 px-4 text-center flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white drop-shadow-md">
            🚀 Amic Learning Hub
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-xl">
            Secure Google Sign-In. Email verified. Subjects you choose show in your dashboard.
          </p>
    
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {cards.map((card, i) => (
              <div
                key={i}
                onClick={() => card.role ? handleRoleClick(card.role) : card.onClick()}
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
      </div>
    );
  }
