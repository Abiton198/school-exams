// src/components/TeacherDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Swal from 'sweetalert2';

export default function TeacherDashboard() {
  const [exams, setExams] = useState([]);
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [password, setPassword] = useState('');
  const [questions, setQuestions] = useState([]);

  const navigate = useNavigate();
  const teacherInfo = JSON.parse(localStorage.getItem('teacherInfo'));

  // ⏱ Auto logout after 1 hour
  useEffect(() => {
    const interval = setInterval(() => {
      const loginTime = parseInt(localStorage.getItem('teacherLoginTime'), 10);
      if (Date.now() - loginTime > 60 * 60 * 1000) {
        Swal.fire('Session expired', 'Please log in again.', 'info').then(() => {
          localStorage.removeItem('teacherInfo');
          localStorage.removeItem('teacherLoginTime');
          navigate('/teacher-login');
        });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 🔐 Redirect to login if not logged in
  useEffect(() => {
    if (!teacherInfo) {
      navigate('/teacher-login');
    }
  }, [teacherInfo, navigate]);

  // 📥 Load exams based on teacher's subject
  useEffect(() => {
    if (!teacherInfo?.subject) return;

    const loadExams = async () => {
      try {
        const q = query(collection(db, 'exams'), where('subject', '==', teacherInfo.subject));
        const snapshot = await getDocs(q);
        setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching exams:', err);
        Swal.fire('Error', 'Failed to load your exams.', 'error');
      }
    };

    loadExams();
  }, [teacherInfo]);

  // ➕ Add a blank question
  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: prev.length + 1,
        type: 'mcq',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        maxMark: 5,
      },
    ]);
  };

  // 🖊️ Update question field or option
  const updateQuestion = (index, field, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      if (field.startsWith('option')) {
        const optIdx = parseInt(field.split('-')[1], 10);
        copy[index].options[optIdx] = value;
      } else {
        copy[index][field] = value;
      }
      return copy;
    });
  };

  // 💾 Save exam to Firestore
  const saveExam = async () => {
    if (!title || !grade || !password || questions.length === 0) {
      Swal.fire('Error', 'Fill all fields and add at least one question.', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'exams'), {
        title,
        grade,
        password,
        subject: teacherInfo.subject, // ✅ Save subject for student dashboard grouping
        questions,
        createdBy: localStorage.getItem('teacherName') || ''
      });

      Swal.fire('✅ Success', 'Exam saved successfully!', 'success');
      setTitle('');
      setGrade('');
      setPassword('');
      setQuestions([]);
    } catch (err) {
      console.error('Error saving exam:', err);
      Swal.fire('❌ Error', 'Could not save the exam.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-28 p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Welcome {teacherInfo?.name} — {teacherInfo?.subject}
      </h2>

      {/* Your Exams List */}
      <div className="bg-white p-4 shadow rounded mb-6">
        <h3 className="text-xl font-semibold mb-3">📚 Your Exams</h3>
        {exams.length === 0 ? (
          <p>No exams created yet.</p>
        ) : (
          <ul className="list-disc pl-6">
            {exams.map(exam => (
              <li key={exam.id}>{exam.title} ({exam.grade})</li>
            ))}
          </ul>
        )}
      </div>

      {/* Create Exam Form */}
      <div className="bg-white p-4 shadow rounded">
        <h3 className="text-xl font-semibold mb-3">📝 Create New Exam</h3>

        <input
          className="border p-2 rounded w-full mb-2"
          placeholder="Exam Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <select
          className="border p-2 rounded w-full mb-2"
          value={grade}
          onChange={e => setGrade(e.target.value)}
        >
          <option value="">Select Grade</option>
          <option>Grade 10</option>
          <option>Grade 11</option>
          <option>Grade 12</option>
        </select>

        <input
          className="border p-2 rounded w-full mb-4"
          placeholder="Exam Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {/* Question Fields */}
        {questions.map((q, i) => (
          <div key={i} className="border p-3 rounded mb-4 bg-gray-50">
            <p className="font-bold mb-2">Question {i + 1}</p>
            <select
              className="border p-1 mb-2 rounded"
              value={q.type}
              onChange={e => updateQuestion(i, 'type', e.target.value)}
            >
              <option value="mcq">MCQ</option>
              <option value="written">Written</option>
            </select>

            <textarea
              className="border p-2 rounded w-full mb-2"
              placeholder="Enter question"
              value={q.question}
              onChange={e => updateQuestion(i, 'question', e.target.value)}
            />

            {q.type === 'mcq' && q.options.map((opt, j) => (
              <input
                key={j}
                className="border p-1 rounded w-full mb-1"
                placeholder={`Option ${j + 1}`}
                value={opt}
                onChange={e => updateQuestion(i, `option-${j}`, e.target.value)}
              />
            ))}

            {q.type === 'mcq' && (
              <input
                className="border p-2 rounded w-full mb-2"
                placeholder="Correct Answer"
                value={q.correctAnswer}
                onChange={e => updateQuestion(i, 'correctAnswer', e.target.value)}
              />
            )}

            {q.type === 'written' && (
              <input
                type="number"
                className="border p-2 rounded w-full"
                placeholder="Max Mark"
                value={q.maxMark}
                onChange={e => updateQuestion(i, 'maxMark', e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="flex space-x-4">
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
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            localStorage.removeItem('teacherInfo');
            localStorage.removeItem('teacherLoginTime');
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
