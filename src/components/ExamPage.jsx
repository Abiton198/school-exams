import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db, signInAnonymously } from '../utils/firebase';
import { signOut } from 'firebase/auth';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function ExamPage({ studentInfo, addResult }) {
  const navigate = useNavigate();
  const [availableExams, setAvailableExams] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [viewing, setViewing] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [examResults, setExamResults] = useState([]);

  const subjects = studentInfo?.subjects || [];

  useEffect(() => {
    if (!studentInfo || !studentInfo.name) {
      navigate('/');
      return;
    }

    signInAnonymously(auth).catch(console.error);
    localStorage.setItem('studentInfo', JSON.stringify(studentInfo));

    const fetchData = async () => {
      const snap = await getDocs(collection(db, `schools/${studentInfo.schoolId}/exams`));
      const exams = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const grade = studentInfo.grade?.replace('Grade ', '');
      setAvailableExams(exams.filter(e => e.grade?.replace('Grade ', '') === grade));

      const resSnap = await getDocs(collection(db, `schools/${studentInfo.schoolId}/examResults`));
      const allResults = resSnap.docs.map(doc => doc.data());
      setExamResults(allResults.filter(r => r.name === studentInfo.name));
    };

    fetchData();

    // ✅ Show welcome or welcome back
    const isFirstTime = !localStorage.getItem('welcomedBefore');
    Swal.fire({
      title: isFirstTime ? `🎉 Welcome, ${studentInfo.name}!` : `👋 Welcome back, ${studentInfo.name}!`,
      text: "What would you like to do today?",
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '📝 Take Exam',
      denyButtonText: '📊 View Results',
      cancelButtonText: '📚 Study',
      confirmButtonColor: '#3B82F6',
      denyButtonColor: '#10B981',
      cancelButtonColor: '#8B5CF6'
    }).then((res) => {
      if (res.isConfirmed) {
        setViewing('exams');
      } else if (res.isDenied) {
        setViewing('results');
      } else {
        navigate(`/chatbot`);
      }
    });

    localStorage.setItem('welcomedBefore', 'true');

  }, [studentInfo, navigate]);

  const handleSelectExam = (exam) => {
    const key = `${studentInfo.name}_${exam.title}_attempts`;
    const attempts = parseInt(localStorage.getItem(key)) || 0;
    if (attempts >= 3) {
      Swal.fire('Max Attempts', 'You already attempted this exam 3 times.', 'error');
      return;
    }
    setSelectedExam(exam);
    setAuthenticated(true);
    localStorage.setItem('examTitle', exam.title);
    localStorage.setItem('examStartTime', new Date().toISOString());
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < selectedExam.questions.length) {
      Swal.fire('Incomplete', 'Answer all questions before submitting.', 'warning');
      return;
    }
    setSubmitted(true);

    const end = new Date();
    const start = new Date(localStorage.getItem('examStartTime'));
    const spent = Math.round((end - start) / 1000);
    const timeFormatted = `${Math.floor(spent / 60)}m ${spent % 60}s`;

    let score = 0, totalPossible = 0;

    const answerDetails = selectedExam.questions.map((q) => {
      const correct = answers[q.id] === q.correctAnswer;
      const maxMark = q.type === 'written' ? parseInt(q.maxMark || 5) : 1;
      totalPossible += maxMark;
      if (q.type === 'mcq' && correct) score++;
      return {
        question: q.question,
        answer: answers[q.id],
        correctAnswer: q.correctAnswer,
        maxMark,
        type: q.type,
        teacherMark: q.type === 'written' ? null : undefined,
      };
    });

    const percentage = ((score / totalPossible) * 100).toFixed(2);
    const result = {
      completedDate: end.toISOString().split('T')[0],
      completedTime: end.toISOString(),
      studentId: studentInfo.studentId,
      name: studentInfo.name,
      grade: studentInfo.grade,
      exam: selectedExam.title,
      subject: selectedExam.subject || '',
      score,
      percentage,
      attempts: (parseInt(localStorage.getItem(`${studentInfo.name}_${selectedExam.title}_attempts`)) || 0) + 1,
      timeSpent: timeFormatted,
      answers: answerDetails,
    };

    await addDoc(collection(db, `schools/${studentInfo.schoolId}/examResults`), result);
    addResult(result);
    localStorage.setItem(`${studentInfo.name}_${selectedExam.title}_attempts`, result.attempts);
    localStorage.setItem(`${studentInfo.name}_${selectedExam.title}_lastAttempt`, end.toISOString());
    navigate('/results');
  };

  useEffect(() => {
    if (authenticated) {
      const t = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(t);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [authenticated]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate('/');
  };

  const handleSubjectClick = async (subject) => {
    setSelectedSubject(subject);

    const { value: choice } = await Swal.fire({
      title: `What would you like to do in ${subject}?`,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '📝 Take Exam',
      denyButtonText: '📊 View Results',
      cancelButtonText: '📚 Study',
      confirmButtonColor: '#3B82F6',
      denyButtonColor: '#10B981',
      cancelButtonColor: '#8B5CF6'
    });

    if (choice === true) {
      setViewing('exams');
    } else if (choice === false) {
      setViewing('results');
    } else {
      navigate(`/chatbot?subject=${encodeURIComponent(subject)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-purple-100 to-pink-100 p-6">
      {/* ✅ Envelope-style Student Card */}
      <div className="max-w-md mx-auto bg-gradient-to-br from-purple-600 to-blue-600 text-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-2">🎓 {studentInfo.name}</h2>
        <p className="text-lg">🏫 <strong>School:</strong> {studentInfo.schoolName}</p>
        <p className="text-lg">📍 <strong>District:</strong> {studentInfo.district}</p>
        <p className="text-lg">🗺️ <strong>Province:</strong> {studentInfo.province}</p>
        <p className="text-lg">🎓 <strong>Grade:</strong> {studentInfo.grade}</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 ml-auto"
        >
          🔒 Logout
        </button>
      </div>

      {!selectedExam && !viewing && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">Select a Subject</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {subjects.length === 0 ? (
              <p className="text-gray-700 text-center col-span-full">No subjects selected during registration.</p>
            ) : (
              subjects.map((subject, idx) => (
                <div
                  key={idx}
                  className="bg-white border p-6 rounded shadow cursor-pointer hover:shadow-md text-center hover:bg-blue-100 transition"
                  onClick={() => handleSubjectClick(subject)}
                >
                  <h3 className="text-lg font-bold text-blue-700">{subject}</h3>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {viewing === 'exams' && !selectedExam && (
        <div className="max-w-4xl mx-auto mt-10">
          <h2 className="text-xl mb-4 text-center">Available Exams in {selectedSubject}</h2>
          {availableExams.filter(e => e.subject === selectedSubject).length === 0 ? (
            <p className="text-center text-gray-700">No exams available for this subject.</p>
          ) : (
            availableExams.filter(e => e.subject === selectedSubject).map((exam) => (
              <div
                key={exam.id}
                onClick={() => handleSelectExam(exam)}
                className="bg-white border p-4 rounded shadow cursor-pointer mb-4 hover:shadow-md hover:bg-green-50 transition"
              >
                <h4 className="font-semibold">{exam.title}</h4>
                <p className="text-sm text-gray-600">{exam.subject}</p>
              </div>
            ))
          )}
        </div>
      )}

      {viewing === 'results' && (
        <div className="max-w-3xl mx-auto mt-10">
          <h2 className="text-xl mb-4 text-center">Your Results in {selectedSubject}</h2>
          {examResults.filter(r => r.subject === selectedSubject).length === 0 ? (
            <p className="text-gray-700 text-center">No results yet.</p>
          ) : (
            <ul className="space-y-4">
              {examResults.filter(r => r.subject === selectedSubject).map((res, i) => (
                <li key={i} className="bg-white p-4 rounded shadow">
                  <p><strong>Exam:</strong> {res.exam}</p>
                  <p><strong>Score:</strong> {res.percentage}%</p>
                  <p><strong>Date:</strong> {res.completedDate}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="text-center mt-6">
            <button onClick={() => { setSelectedSubject(''); setViewing(''); }} className="px-4 py-2 bg-gray-500 text-white rounded">🔙 Back</button>
          </div>
        </div>
      )}

      {authenticated && selectedExam && (
        <div className="max-w-4xl mx-auto mt-10">
          <h2 className="text-xl mb-4 text-center">{selectedExam.title}</h2>
          <div className="text-center text-red-600 text-2xl mb-6">Time Left: {formatTime(timeLeft)}</div>
          {!submitted ? (
            <form className="space-y-6">
              {selectedExam.questions.map((q, i) => (
                <div key={q.id} className="bg-white p-4 rounded shadow">
                  <h3 className="font-semibold">Q{i + 1}: {q.question}</h3>
                  {q.type === 'mcq' ? (
                    q.options.map((opt, j) => (
                      <label key={j} className="block mt-2">
                        <input
                          type="radio"
                          name={`q${q.id}`}
                          value={opt}
                          onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        />{' '}
                        {opt}
                      </label>
                    ))
                  ) : (
                    <textarea
                      className="w-full mt-2 p-2 border rounded"
                      placeholder="Type your answer..."
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  Swal.fire({
                    title: 'Submit?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Submit',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#22c55e',
                    cancelButtonColor: '#ef4444',
                  }).then(res => res.isConfirmed && handleSubmit())
                }
                className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700"
              >
                ✅ Submit Exam
              </button>
            </form>
          ) : (
            <p className="text-center font-medium mt-6">Submitting...</p>
          )}
        </div>
      )}
    </div>
  );
}
