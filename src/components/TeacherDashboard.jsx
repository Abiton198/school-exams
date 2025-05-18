import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Swal from 'sweetalert2';
import { auth, signInAnonymously } from '../utils/firebase';



export default function TeacherDashboard() {
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [password, setPassword] = useState('');
  const [questions, setQuestions] = useState([]);
  
  useEffect(() => {
    signInAnonymously(auth)
      .then(() => console.log('✅ Anonymous auth successful'))
      .catch((err) => console.error('❌ Auth error:', err));
  }, []);

  const addQuestion = () => {
    setQuestions([...questions, {
      id: questions.length + 1,
      type: 'mcq',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      maxMark: 5
    }]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    if (field.startsWith('option')) {
      const optIndex = parseInt(field.split('-')[1]);
      updated[index].options[optIndex] = value;
    } else {
      updated[index][field] = value;
    }
    setQuestions(updated);
  };

  const saveExam = async () => {
    if (!title || !grade || !password || questions.length === 0) {
      Swal.fire('Error', 'All fields and at least one question are required.', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'exams'), {
        title,
        grade,
        password,
        questions
      });
      Swal.fire('Success', 'Exam saved to Firestore ✅', 'success');
      setTitle('');
      setGrade('');
      setPassword('');
      setQuestions([]);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to save exam.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-28 p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">📝 Create New Exam</h2>

      <div className="grid gap-4">
        <input className="border p-2 rounded" value={title} onChange={e => setTitle(e.target.value)} placeholder="Exam Title" />
        <select className="border p-2 rounded" value={grade} onChange={e => setGrade(e.target.value)}>
          <option value="">Select Grade</option>
          <option>Grade 10</option>
          <option>Grade 11</option>
          <option>Grade 12</option>
        </select>
        <input className="border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} placeholder="Access Password" />
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">Questions</h3>
        {questions.map((q, i) => (
          <div key={i} className="border p-4 rounded mb-4 bg-white shadow-sm">
            <h4 className="font-bold mb-2">Question {i + 1}</h4>
            <select className="border p-1 mb-2" value={q.type} onChange={e => updateQuestion(i, 'type', e.target.value)}>
              <option value="mcq">MCQ</option>
              <option value="written">Written</option>
            </select>
            <textarea
              className="w-full border p-2 rounded mb-2"
              placeholder="Enter question"
              value={q.question}
              onChange={e => updateQuestion(i, 'question', e.target.value)}
            />

            {q.type === 'mcq' && q.options.map((opt, idx) => (
              <input
                key={idx}
                className="w-full border p-1 rounded mb-1"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={e => updateQuestion(i, `option-${idx}`, e.target.value)}
              />
            ))}

            {q.type === 'mcq' && (
              <input
                className="w-full border p-2 rounded mb-2"
                placeholder="Correct Answer"
                value={q.correctAnswer}
                onChange={e => updateQuestion(i, 'correctAnswer', e.target.value)}
              />
            )}

            {q.type === 'written' && (
              <input
                className="w-full border p-2 rounded mb-2"
                placeholder="Max Mark (e.g. 5)"
                value={q.maxMark}
                onChange={e => updateQuestion(i, 'maxMark', e.target.value)}
              />
            )}
          </div>
        ))}

        <button onClick={addQuestion} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Question</button>
      </div>

      <div className="mt-6 text-center">
        <button onClick={saveExam} className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-semibold">
          Save Exam to Firestore
        </button>
      </div>
    </div>
  );
}
