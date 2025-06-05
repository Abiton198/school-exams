// src/components/TeacherDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import Swal from 'sweetalert2';

export default function TeacherDashboard() {
  const navigate = useNavigate();

  // --- 1) BASIC STATE ---
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);

  // Form fields for creating an exam
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [password, setPassword] = useState('');
  const [questions, setQuestions] = useState([]);

  // Session timer
  const [timeLeft, setTimeLeft] = useState(60);
  const expirationRef = useRef(null);
  const timeoutRef = useRef(null);

  // --- 2) AUTH GUARD + INITIALIZATION ---
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) return navigate('/teacher-login');

      const info = JSON.parse(localStorage.getItem('teacherInfo'));
      if (!info) {
        auth.signOut().finally(() => navigate('/teacher-login'));
        return;
      }
      setTeacherInfo(info);
      setLoading(false);

      const stored = localStorage.getItem('teacherLoginTime');
      const loginTime = stored ? parseInt(stored, 10) : Date.now();
      localStorage.setItem('teacherLoginTime', loginTime.toString());

      expirationRef.current = loginTime + 60 * 60 * 1000;
      const msUntilExpiry = expirationRef.current - Date.now();
      timeoutRef.current = setTimeout(() => {
        Swal.fire('Session expired', 'Please log in again.', 'info').then(() => {
          auth.signOut().finally(() => {
            localStorage.clear();
            navigate('/teacher-login');
          });
        });
      }, msUntilExpiry);
    });
    return () => {
      unsub();
      clearTimeout(timeoutRef.current);
    };
  }, [navigate]);

  // --- 3) COUNTDOWN TIMER ---
  useEffect(() => {
    if (loading) return;
    const tick = () => {
      const now = Date.now();
      const mins = Math.max(0, Math.ceil((expirationRef.current - now) / (60 * 1000)));
      setTimeLeft(mins);
    };
    tick();
    const iv = setInterval(tick, 60 * 1000);
    return () => clearInterval(iv);
  }, [loading]);

  // --- 4) LOAD RESULTS FOR TEACHER'S SUBJECT ---
  useEffect(() => {
    const loadResults = async () => {
      try {
        const q = query(collection(db, 'examResults'), where('subject', '==', teacherInfo.subject));
        const snap = await getDocs(q);
        setResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Failed to load results:', err);
        Swal.fire('Error', 'Failed to load results.', 'error');
      }
    };
    if (teacherInfo) loadResults();
  }, [teacherInfo]);

  // --- 5) PREVENT RENDER UNTIL DATA IS READY ---
  if (loading) {
    return <div className="text-center mt-20 text-gray-500">Loading dashboard...</div>;
  }

  // --- 6) EXAM CREATION HELPERS ---
  const addQuestion = () => {
    setQuestions(qs => [
      ...qs,
      { id: qs.length + 1, type: 'mcq', question: '', options: ['', '', '', ''], correctAnswer: '', maxMark: 5 }
    ]);
  };

  const updateQuestion = (i, field, val) => {
    setQuestions(qs => {
      const copy = [...qs];
      if (field.startsWith('option')) {
        const idx = +field.split('-')[1];
        copy[i].options[idx] = val;
      } else {
        copy[i][field] = val;
      }
      return copy;
    });
  };

  const saveExam = async () => {
    if (!title || !grade || !password || questions.length === 0) {
      return Swal.fire('Error', 'Fill all fields and add a question.', 'error');
    }
    try {
      await addDoc(collection(db, 'exams'), {
        title, grade, password,
        subject: teacherInfo.subject,
        questions,
        createdBy: teacherInfo.name
      });
      Swal.fire('Success', 'Exam saved!', 'success');
      setTitle(''); setGrade(''); setPassword(''); setQuestions([]);
      const q = query(collection(db, 'exams'), where('subject', '==', teacherInfo.subject));
      const snap = await getDocs(q);
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Could not save exam.', 'error');
    }
  };

  const deleteExam = async (id) => {
    const confirmed = await Swal.fire({
      title: 'Delete this exam?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it'
    });

    if (!confirmed.isConfirmed) return;

    try {
      await deleteDoc(doc(db, 'exams', id));
      setExams(exams.filter(e => e.id !== id));
      Swal.fire('Deleted!', 'Exam has been deleted.', 'success');
    } catch (err) {
      console.error("❌ Failed to delete exam", err);
      Swal.fire('Error', 'Could not delete exam.', 'error');
    }
  };
  console.log("📌 teacherSubject:", teacherInfo.subject);
console.log("📌 teacherName:", teacherInfo.name);


  // --- 7) RENDER DASHBOARD ---
  return (
    <div className="max-w-5xl mx-auto pt-28 p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Welcome {teacherInfo.name} — {teacherInfo.subject}
      </h2>

      <div className="text-sm text-right text-gray-600 mb-4">
        ⏳ Session expires in: <strong>{timeLeft}</strong> min
      </div>

      {/* EXAMS LIST */}
      <div className="bg-white p-4 shadow rounded mb-6">
        <h3 className="text-xl font-semibold mb-3">📚 Your Exams</h3>
        {exams.length === 0
          ? <p>No exams yet.</p>
          : (
            <ul className="list-disc pl-6">
              {exams.map(e => (
                <li key={e.id}>
                  {e.title} ({e.grade})
                  <button className="ml-2 text-sm text-red-600 underline" onClick={() => deleteExam(e.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
      </div>

      {/* RESULTS SECTION */}
      <div className="bg-white p-4 shadow rounded mb-6">
        <h3 className="text-xl font-semibold mb-3">📊 Exam Results</h3>
        {results.length === 0 ? (
          <p>No results yet.</p>
        ) : (
          <table className="w-full text-left border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Student</th>
                <th className="p-2 border">Grade</th>
                <th className="p-2 border">Exam</th>
                <th className="p-2 border">Score</th>
                <th className="p-2 border">%</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td className="p-2 border">{r.completedDate}</td>
                  <td className="p-2 border">{r.name}</td>
                  <td className="p-2 border">{r.grade}</td>
                  <td className="p-2 border">{r.exam}</td>
                  <td className="p-2 border">{r.score}</td>
                  <td className="p-2 border">{r.percentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE EXAM FORM */}
      <div className="bg-white p-4 shadow rounded mb-6">
        <h3 className="text-xl font-semibold mb-3">📝 Create New Exam</h3>
        <input className="border p-2 rounded w-full mb-2" placeholder="Exam Title" value={title} onChange={e => setTitle(e.target.value)} />
        <select className="border p-2 rounded w-full mb-2" value={grade} onChange={e => setGrade(e.target.value)}>
          <option value="">Select Grade</option>
          <option>Grade 10</option>
          <option>Grade 11</option>
          <option>Grade 12</option>
        </select>
        <input className="border p-2 rounded w-full mb-4" placeholder="Exam Password" value={password} onChange={e => setPassword(e.target.value)} />

        {questions.map((q, i) => (
          <div key={i} className="border p-3 rounded mb-4 bg-gray-50">
            <p className="font-bold mb-2">Question {i + 1}</p>
            <select className="border p-1 mb-2 rounded" value={q.type} onChange={e => updateQuestion(i, 'type', e.target.value)}>
              <option value="mcq">MCQ</option>
              <option value="written">Written</option>
            </select>
            <textarea className="border p-2 rounded w-full mb-2" placeholder="Enter question" value={q.question} onChange={e => updateQuestion(i, 'question', e.target.value)} />
            {q.type === 'mcq' && q.options.map((opt, j) => (
              <input key={j} className="border p-1 rounded w-full mb-1" placeholder={`Option ${j + 1}`} value={opt} onChange={e => updateQuestion(i, `option-${j}`, e.target.value)} />
            ))}
            {q.type === 'mcq' && (
              <input className="border p-2 rounded w-full mb-2" placeholder="Correct Answer" value={q.correctAnswer} onChange={e => updateQuestion(i, 'correctAnswer', e.target.value)} />
            )}
            {q.type === 'written' && (
              <input type="number" className="border p-2 rounded w-full" placeholder="Max Mark" value={q.maxMark} onChange={e => updateQuestion(i, 'maxMark', e.target.value)} />
            )}
          </div>
        ))}

        <div className="flex space-x-4">
          <button onClick={addQuestion} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">➕ Add Question</button>
          <button onClick={saveExam} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">💾 Save Exam</button>
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <div className="text-center">
        <button
          onClick={async () => {
            await auth.signOut();
            clearTimeout(timeoutRef.current);
            localStorage.clear();
            navigate('/teacher-login');
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}


// ! teacher dashboard not showing deatils when logged in
// !check other subjects if they are appearing on dashboard after use...