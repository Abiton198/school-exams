// src/components/TeacherDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Swal from 'sweetalert2';

export default function TeacherDashboard() {
  // — State
  const [exams, setExams] = useState([]);           // holds fetched exams
  const [title, setTitle] = useState('');           // new exam title
  const [grade, setGrade] = useState('');           // new exam grade
  const [password, setPassword] = useState('');     // new exam password
  const [questions, setQuestions] = useState([]);   // new exam questions

  const navigate = useNavigate();
  const teacherInfo = JSON.parse(localStorage.getItem('teacherInfo'));

  // to logout teacher if time expires and triggers message
  useEffect(() => {
    const interval = setInterval(() => {
      const loginTime = parseInt(localStorage.getItem('teacherLoginTime'), 10);
      if (Date.now() - loginTime > 60 * 60 * 1000) {
        // 1 hour passed
        Swal.fire('Session expired', 'Please log in again.', 'info').then(() => {
          localStorage.removeItem('teacherInfo');
          localStorage.removeItem('teacherLoginTime');
          navigate('/teacher-login');
        });
      }
    }, 60000); // check every 60s
  
    return () => clearInterval(interval);
  }, []);
  

  // — Redirect to login if no teacherInfo
  useEffect(() => {
    if (!teacherInfo) {
      navigate('/teacher-login');
    }
  }, [teacherInfo, navigate]);

  // — Load exams for this teacher’s subject
  useEffect(() => {
    if (!teacherInfo?.subject) return;

    const loadExams = async () => {
      try {
        const q = query(
          collection(db, 'exams'),
          where('subject', '==', teacherInfo.subject)
        );
        const snap = await getDocs(q);
        setExams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching exams:', err);
        Swal.fire('Error', 'Failed to load your exams.', 'error');
      }
    };

    loadExams();
  }, [teacherInfo]);

  // — Add a blank question
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

  // — Update a question or its options
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

  // — Save new exam to Firestore
  const saveExam = async () => {
    if (!title || !grade || !password || questions.length === 0) {
      Swal.fire('Error', 'Fill all fields and add at least one question.', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'exams'), {
        title,
        grade,
        subject: teacherInfo.subject,
        password,
        questions,
      });
      Swal.fire('Success', 'Exam saved!', 'success');
      // reset form
      setTitle('');
      setGrade('');
      setPassword('');
      setQuestions([]);
      // reload exams
      // (optional: call loadExams again or rely on onSnapshot in future)
    } catch (err) {
      console.error('Error saving exam:', err);
      Swal.fire('Error', 'Could not save exam.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-28 p-4">
      {/* Welcome header */}
      <h2 className="text-2xl font-bold mb-6 text-center">
        Welcome {teacherInfo?.name || 'Teacher'} — {teacherInfo?.subject || ''}
      </h2>

      {/* Existing Exams */}
      <div className="bg-white p-4 shadow rounded mb-6">
        <h3 className="text-xl font-semibold mb-3">📚 Your Exams</h3>
        {exams.length === 0 ? (
          <p>No exams created yet.</p>
        ) : (
          <ul className="list-disc pl-6">
            {exams.map(exam => (
              <li key={exam.id}>
                {exam.title} ({exam.grade})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create New Exam Form */}
      <div className="bg-white p-4 shadow rounded">
        <h3 className="text-xl font-semibold mb-3">📝 Create New Exam</h3>
        {/* Title */}
        <input
          className="border p-2 rounded w-full mb-2"
          placeholder="Exam Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        {/* Grade */}
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
        {/* Password */}
        <input
          className="border p-2 rounded w-full mb-4"
          placeholder="Exam Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {/* Questions List */}
        {questions.map((q, i) => (
          <div key={i} className="border p-3 rounded mb-4 bg-gray-50">
            <p className="font-bold mb-2">Question {i + 1}</p>
            {/* Type selector */}
            <select
              className="border p-1 mb-2 rounded"
              value={q.type}
              onChange={e => updateQuestion(i, 'type', e.target.value)}
            >
              <option value="mcq">MCQ</option>
              <option value="written">Written</option>
            </select>
            {/* Question text */}
            <textarea
              className="border p-2 rounded w-full mb-2"
              placeholder="Enter question"
              value={q.question}
              onChange={e => updateQuestion(i, 'question', e.target.value)}
            />
            {/* MCQ options */}
            {q.type === 'mcq' &&
              q.options.map((opt, j) => (
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
            {/* Written max mark */}
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

        {/* Buttons */}
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

                <button
            onClick={() => {
              localStorage.removeItem('teacherInfo');
              navigate('/teacher-login');
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>

    </div>
  );
}
