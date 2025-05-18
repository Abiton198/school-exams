import React, { useEffect, useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
  const [exams, setExams] = useState([]);
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [password, setPassword] = useState('');
  const [questions, setQuestions] = useState([]);

  const navigate = useNavigate();

  // ✅ Get teacher info from localStorage
  const teacherInfo = JSON.parse(localStorage.getItem('teacherInfo'));

  // 🔐 Redirect to login if teacher is not authenticated
  useEffect(() => {
    if (!teacherInfo) {
      navigate('/teacher-login');
    }
  }, [teacherInfo, navigate]);

  // 📥 Load exams for the logged-in teacher's subject
  useEffect(() => {
    const loadExams = async () => {
      if (!teacherInfo?.subject) return;

      try {
        const q = query(collection(db, 'exams'), where('subject', '==', teacherInfo.subject));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExams(fetched);
      } catch (err) {
        console.error('Error fetching exams:', err);
        Swal.fire('Error', 'Failed to load exams.', 'error');
      }
    };

    loadExams();
  }, [teacherInfo]);

  // ➕ Add a new empty question
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

  // 🔄 Update a question or its options
  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    if (field.startsWith('option')) {
      const optIndex = parseInt(field.split('-')[1], 10);
      updated[index].options[optIndex] = value;
    } else {
      updated[index][field] = value;
    }
    setQuestions(updated);
  };

  // 💾 Save the exam to Firestore
  const saveExam = async () => {
    if (!title || !grade || !password || questions.length === 0) {
      Swal.fire('Error', 'Please fill in all fields and add at least one question.', 'error');
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

      Swal.fire('✅ Success', 'Exam saved successfully!', 'success');

      // 🔄 Reset fields after saving
      setTitle('');
      setGrade('');
      setPassword('');
      setQuestions([]);
    } catch (err) {
      console.error('Error saving exam:', err);
      Swal.fire('Error', 'Failed to save exam to Firestore.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-28 p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Welcome {teacherInfo?.name || 'Teacher'} - {teacherInfo?.subject || ''}
      </h2>

      {/* 📄 Display list of saved exams */}
      <div className="bg-white p-4 shadow rounded mb-6">
        <h3 className="text-xl font-semibold mb-3">📚 Your Exams</h3>
        {exams.length === 0 ? (
          <p>No exams created yet.</p>
        ) : (
          <ul className="list-disc pl-6">
            {exams.map((exam) => (
              <li key={exam.id}>
                {exam.title} ({exam.grade})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 📝 Create New Exam Form */}
      <div className="bg-white p-4 shadow rounded">
        <h3 className="text-xl font-semibold mb-3">📝 Create New Exam</h3>
        <input
          className="border p-2 rounded w-full mb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Exam Title"
        />
        <select
          className="border p-2 rounded w-full mb-2"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          <option value="">Select Grade</option>
          <option>Grade 10</option>
          <option>Grade 11</option>
          <option>Grade 12</option>
        </select>
        <input
          className="border p-2 rounded w-full mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Exam Access Password"
        />

        {/* 👇 List of questions added */}
        {questions.map((q, i) => (
          <div key={i} className="border p-3 rounded mb-4 bg-gray-50">
            <p className="font-bold mb-2">Question {i + 1}</p>
            <select
              value={q.type}
              onChange={(e) => updateQuestion(i, 'type', e.target.value)}
              className="border p-1 mb-2 rounded"
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
            {/* MCQ Options */}
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
            {/* Written Answer Max Mark */}
            {q.type === 'written' && (
              <input
                type="number"
                className="border p-2 rounded w-full"
                placeholder="Max Mark (e.g. 5)"
                value={q.maxMark}
                onChange={(e) => updateQuestion(i, 'maxMark', e.target.value)}
              />
            )}
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="bg-blue-600 text-white px-4 py-2 rounded mr-4 hover:bg-blue-700"
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
  );
}
