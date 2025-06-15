import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../utils/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import TeacherChatPopup from '../utils/TeacherChatPopup';

// ✅ Enhanced SweetAlert with React styling
const MySwal = withReactContent(Swal);

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const expirationRef = useRef(null);
  const timeoutRef = useRef(null);

  // ✅ 1️⃣ AUTH & SESSION GUARD
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/');
        return;
      }

      let info = JSON.parse(localStorage.getItem('teacherInfo'));
      if (!info) {
        info = {
          name: user.displayName || 'Teacher',
          email: user.email,
          uid: user.uid,
          subject: localStorage.getItem('teacherSubject') || '',
        };
        localStorage.setItem('teacherInfo', JSON.stringify(info));
      }

      setTeacherInfo(info);
      setLoading(false);

      const loginTime = parseInt(localStorage.getItem('teacherLoginTime')) || Date.now();
      localStorage.setItem('teacherLoginTime', loginTime.toString());
      expirationRef.current = loginTime + 60 * 60 * 1000;

      const msUntilExpiry = expirationRef.current - Date.now();
      timeoutRef.current = setTimeout(() => {
        Swal.fire('Session expired', 'Please sign in again.', 'info').then(() => handleLogout());
      }, msUntilExpiry);
    });

    return () => {
      unsub();
      clearTimeout(timeoutRef.current);
    };
  }, [navigate]);

  // ✅ 2️⃣ Session countdown
  useEffect(() => {
    if (loading) return;
    const tick = () => {
      const mins = Math.max(0, Math.ceil((expirationRef.current - Date.now()) / (60 * 1000)));
      setTimeLeft(mins);
    };
    tick();
    const iv = setInterval(tick, 60 * 1000);
    return () => clearInterval(iv);
  }, [loading]);

  // ✅ 3️⃣ Load results
  useEffect(() => {
    const loadResults = async () => {
      if (!teacherInfo?.subject) return;
      const q = query(collection(db, 'examResults'), where('subject', '==', teacherInfo.subject));
      const snap = await getDocs(q);
      setResults(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    if (teacherInfo) loadResults();
  }, [teacherInfo]);

  // ✅ 4️⃣ Questions handlers
  const addQuestion = () => {
    setQuestions(qs => [
      ...qs,
      {
        id: qs.length + 1,
        type: 'mcq',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        maxMark: 5,
      },
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

  // ✅ 5️⃣ Save Exam — with styled Swal
  const saveExam = async () => {
    if (!title || !grade || questions.length === 0) {
      return MySwal.fire('Error', 'Fill all fields and add at least one question.', 'error');
    }
    try {
      await addDoc(collection(db, 'exams'), {
        title,
        grade,
        subject: teacherInfo.subject,
        questions,
        createdBy: teacherInfo.name,
      });
      MySwal.fire({
        title: 'Success',
        text: 'Exam saved!',
        icon: 'success',
        confirmButtonColor: '#22c55e',
      });
      setTitle('');
      setGrade('');
      setQuestions([]);
    } catch (err) {
      console.error(err);
      MySwal.fire('Error', 'Could not save exam.', 'error');
    }
  };

  // ✅ 6️⃣ Delete Exam — clear colors
  const deleteExam = async (id) => {
    const confirmed = await MySwal.fire({
      title: 'Delete this exam?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626', // red
      cancelButtonColor: '#6b7280',  // gray
    });
    if (!confirmed.isConfirmed) return;

    try {
      await deleteDoc(doc(db, 'exams', id));
      setExams(exams.filter(e => e.id !== id));
      MySwal.fire({
        title: 'Deleted!',
        text: 'Exam deleted.',
        icon: 'success',
        confirmButtonColor: '#22c55e',
      });
    } catch (err) {
      console.error(err);
      MySwal.fire('Error', 'Could not delete.', 'error');
    }
  };

  // ✅ 7️⃣ Logout — clear colors
  const handleLogout = async () => {
    const confirm = await MySwal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });
    if (confirm.isConfirmed) {
      await signOut(auth);
      localStorage.clear();
      navigate('/');
    }
  };

  if (loading || !teacherInfo) {
    return <div className="text-center mt-20 text-gray-500">Loading dashboard...</div>;
  }

  // ✅ 8️⃣ UI
  return (
    <div className="max-w-5xl mx-auto pt-28 p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Welcome {teacherInfo.name} — {teacherInfo.subject || 'Your Subject'}
      </h2>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => navigate('/all-results')}
          className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
        >
          📊 All Results
        </button>
        <button
          onClick={() => navigate('/exam-manager')}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
        >
          🛠 Exam Manager
        </button>
      </div>

      <div className="text-sm text-right text-gray-600 mb-4">
        ⏳ Session expires in: <strong>{timeLeft}</strong> min
      </div>

      <TeacherChatPopup teacherName={teacherInfo.name} teacherId={teacherInfo.uid} />

      {/* Exams */}
      <div className="bg-white p-4 shadow rounded mb-6">
        <h3 className="text-xl font-semibold mb-3">📚 Your Exams</h3>
        {exams.length === 0 ? (
          <p>No exams yet.</p>
        ) : (
          <ul className="list-disc pl-6">
            {exams.map((e) => (
              <li key={e.id}>
                {e.title} ({e.grade})
                <button
                  className="ml-2 text-sm text-red-600 underline"
                  onClick={() => deleteExam(e.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Results */}
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

      {/* Create Exam */}
      <div className="bg-white p-4 shadow rounded mb-6">
        <h3 className="text-xl font-semibold mb-3">📝 Create New Exam</h3>
        <input
          className="border p-2 rounded w-full mb-2"
          placeholder="Exam Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="border p-2 rounded w-full mb-4"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          <option value="">Select Grade</option>
          <option>Grade 10</option>
          <option>Grade 11</option>
          <option>Grade 12</option>
        </select>

        {questions.map((q, i) => (
          <div key={i} className="border p-3 rounded mb-4 bg-gray-50">
            <p className="font-bold mb-2">Question {i + 1}</p>
            <select
              className="border p-1 mb-2 rounded"
              value={q.type}
              onChange={(e) => updateQuestion(i, 'type', e.target.value)}
            >
              <option value="mcq">MCQ</option>
              <option value="written">Written</option>
            </select>
            <textarea
              className="border p-2 rounded w-full mb-2"
              placeholder="Enter question"
              value={q.question}
              onChange={(e) => updateQuestion(i, 'question', e.target.value)}
            />
            {q.type === 'mcq' &&
              q.options.map((opt, j) => (
                <input
                  key={j}
                  className="border p-1 rounded w-full mb-1"
                  placeholder={`Option ${j + 1}`}
                  value={opt}
                  onChange={(e) => updateQuestion(i, `option-${j}`, e.target.value)}
                />
              ))}
            {q.type === 'mcq' && (
              <input
                className="border p-2 rounded w-full mb-2"
                placeholder="Correct Answer"
                value={q.correctAnswer}
                onChange={(e) => updateQuestion(i, 'correctAnswer', e.target.value)}
              />
            )}
            {q.type === 'written' && (
              <input
                type="number"
                className="border p-2 rounded w-full"
                placeholder="Max Mark"
                value={q.maxMark}
                onChange={(e) => updateQuestion(i, 'maxMark', e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="flex gap-4">
          <button
            onClick={addQuestion}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ➕ Add Question
          </button>
          <button
            onClick={saveExam}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            💾 Save Exam
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="text-center">
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
