import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth, signInAnonymously } from '../utils/firebase';
import Swal from 'sweetalert2';

export default function TeacherDashboard() {
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [password, setPassword] = useState('');
  const [questions, setQuestions] = useState([]);

  // Auto sign in anonymously
  useEffect(() => {
    signInAnonymously(auth)
      .then(() => console.log('✅ Anonymous auth successful'))
      .catch((err) => console.error('❌ Auth error:', err));
  }, []);

  // Add a new blank question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: questions.length + 1,
        type: 'mcq',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        maxMark: 5,
        image: null,
      },
    ]);
  };

  // Remove question at specific index
  const removeQuestion = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  // Handle change for question fields
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

  // Handle image upload as base64
  const handleImageUpload = (index, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...questions];
      updated[index].image = reader.result;
      setQuestions(updated);
    };
    reader.readAsDataURL(file);
  };

  // Save exam to Firestore (after preview)
  const saveExam = async () => {
    if (!title || !grade || !password || questions.length === 0) {
      Swal.fire('Error', 'All fields and at least one question are required.', 'error');
      return;
    }

    const previewHTML = `
      <strong>Title:</strong> ${title}<br>
      <strong>Grade:</strong> ${grade}<br>
      <strong>Questions:</strong> ${questions.length}
    `;

    Swal.fire({
      title: 'Preview Exam',
      html: previewHTML,
      showCancelButton: true,
      confirmButtonText: 'Save to Firestore',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await addDoc(collection(db, 'exams'), {
            title,
            grade,
            password,
            questions,
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
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto pt-28 p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">📝 Create New Exam</h2>

      {/* Basic exam info */}
      <div className="grid gap-4">
        <input
          className="border p-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Exam Title"
        />
        <select className="border p-2 rounded" value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="">Select Grade</option>
          <option>Grade 10</option>
          <option>Grade 11</option>
          <option>Grade 12</option>
        </select>
        <input
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Access Password"
        />
      </div>

      {/* Question List */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">Questions</h3>
        {questions.map((q, i) => (
          <div key={i} className="border p-4 rounded mb-4 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold">Question {i + 1}</h4>
              <button
                onClick={() => removeQuestion(i)}
                className="text-red-600 hover:underline text-sm"
              >
                🗑 Remove
              </button>
            </div>

            <select
              className="border p-1 mb-2"
              value={q.type}
              onChange={(e) => updateQuestion(i, 'type', e.target.value)}
            >
              <option value="mcq">MCQ</option>
              <option value="written">Written</option>
            </select>

            <textarea
              className="w-full border p-2 rounded mb-2"
              placeholder="Enter question"
              value={q.question}
              onChange={(e) => updateQuestion(i, 'question', e.target.value)}
            />

            {/* Image upload */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(i, e.target.files[0])}
              className="mb-2"
            />
            {q.image && <img src={q.image} alt="Question" className="w-32 h-auto border rounded mb-2" />}

            {/* MCQ Options */}
            {q.type === 'mcq' &&
              q.options.map((opt, idx) => (
                <input
                  key={idx}
                  className="w-full border p-1 rounded mb-1"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => updateQuestion(i, `option-${idx}`, e.target.value)}
                />
              ))}

            {/* MCQ Correct Answer */}
            {q.type === 'mcq' && (
              <input
                className="w-full border p-2 rounded mb-2"
                placeholder="Correct Answer"
                value={q.correctAnswer}
                onChange={(e) => updateQuestion(i, 'correctAnswer', e.target.value)}
              />
            )}

            {/* Written Max Mark */}
            {q.type === 'written' && (
              <input
                className="w-full border p-2 rounded mb-2"
                placeholder="Max Mark (e.g. 5)"
                value={q.maxMark}
                onChange={(e) => updateQuestion(i, 'maxMark', e.target.value)}
              />
            )}
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          ➕ Add Question
        </button>
      </div>

      {/* Save Exam Button */}
      <div className="mt-6 text-center">
        <button
          onClick={saveExam}
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-semibold"
        >
          ✅ Save Exam to Firestore
        </button>
      </div>
    </div>
  );
}
