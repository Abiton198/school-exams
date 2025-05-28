import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db, signInAnonymously } from '../utils/firebase';

// ⏳ Helper to format seconds into mm:ss
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function ExamPage({ studentInfo, addResult }) {
  const navigate = useNavigate();
  const [availableExams, setAvailableExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const currentQuestions = selectedExam?.questions || [];

  // ✅ Anonymous login for students
  useEffect(() => {
    signInAnonymously(auth).then(() =>
      console.log('✅ Anonymous sign-in')
    ).catch(console.error);
  }, []);

  // ✅ Load exams & extract subjects
  useEffect(() => {
    if (!studentInfo) {
      navigate('/');
      return;
    }

    localStorage.setItem('studentName', studentInfo.name);
    localStorage.setItem('studentGrade', studentInfo.grade);
    localStorage.setItem('studentId', studentInfo.studentId);
    localStorage.setItem('examStartTime', new Date().toISOString());

    const fetchExams = async () => {
      try {
        const snap = await getDocs(collection(db, 'exams'));
        const allExams = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const filtered = allExams.filter(
          (e) => e.grade?.replace("Grade ", "") === studentInfo.grade?.replace("Grade ", "")
        );

        setAvailableExams(filtered);

        // Extract unique subjects
        const uniqueSubjects = [...new Set(filtered.map(exam => exam.subject || 'General'))];
        setSubjects(uniqueSubjects);
      } catch (err) {
        console.error('Error loading exams:', err);
      }
    };

    fetchExams();
  }, [studentInfo, navigate]);

  // ✅ Student selects an exam
  const handleSelectExam = (exam) => {
    const studentName = localStorage.getItem('studentName');
    const attemptsKey = `${studentName}_${exam.title}_attempts`;
    const lastAttemptKey = `${studentName}_${exam.title}_lastAttempt`;

    const attempts = parseInt(localStorage.getItem(attemptsKey)) || 0;
    const lastAttemptTime = localStorage.getItem(lastAttemptKey);
    const now = new Date();

    if (attempts >= 3) {
      Swal.fire('⛔', 'You have already attempted this exam 3 times.', 'error');
      return;
    }

    if (lastAttemptTime) {
      const last = new Date(lastAttemptTime);
      const hoursSince = (now - last) / 1000 / 60 / 60;
      if (hoursSince < 48) {
        const hoursLeft = Math.ceil(48 - hoursSince);
        Swal.fire('⏳', `Please wait ${hoursLeft} more hour(s) to retry.`, 'warning');
        return;
      }
    }

    Swal.fire({
      title: `Enter Password for ${exam.title}`,
      input: 'password',
      inputPlaceholder: 'Password',
      showCancelButton: true,
      confirmButtonText: 'Enter',
      preConfirm: (inputPassword) => {
        if (inputPassword === exam.password) {
          setSelectedExam(exam);
          setAuthenticated(true);
          localStorage.setItem('examTitle', exam.title);
          return true;
        } else {
          Swal.showValidationMessage('Incorrect password');
          return false;
        }
      }
    });
  };

  const handleChange = (id, answer) => {
    setAnswers(prev => ({ ...prev, [id]: answer }));
  };

  // ✅ Exam submission
  const handleSubmit = async () => {
    if (Object.keys(answers).length < currentQuestions.length) {
      alert('❗ You must answer all questions before submitting.');
      return;
    }

    setSubmitted(true);
    await handleSubmitExam();
  };

  // ✅ Save result to Firestore
  const handleSubmitExam = async () => {
    const endTime = new Date();
    const startTime = new Date(localStorage.getItem('examStartTime') || new Date());
    const timeSpent = Math.round((endTime - startTime) / 1000);
    const timeSpentFormatted = `${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`;

    const studentName = localStorage.getItem('studentName') || 'Unknown';
    const studentGrade = localStorage.getItem('studentGrade') || 'N/A';
    const studentId = localStorage.getItem('studentId') || 'unknown-id';
    const examTitle = localStorage.getItem('examTitle') || 'Unnamed Exam';

    const attemptsKey = `${studentName}_${examTitle}_attempts`;
    const previousAttempts = parseInt(localStorage.getItem(attemptsKey)) || 0;
    const updatedAttempts = previousAttempts + 1;

    let score = 0;
    let totalPossible = 0;

    const answerData = currentQuestions.map((q) => {
      const type = q.type || 'mcq';
      const isCorrect = answers[q.id] === q.correctAnswer;
      const maxMark = type === 'written' ? parseInt(q.maxMark || 5) : 1;

      totalPossible += maxMark;
      if (type === 'mcq' && isCorrect) score += 1;

      return {
        question: q.question,
        type,
        answer: answers[q.id] || '',
        correctAnswer: q.correctAnswer || null,
        maxMark,
        teacherMark: type === 'written' ? null : undefined
      };
    });

    const percentage = ((score / totalPossible) * 100).toFixed(2);

    const result = {
      completedDate: endTime.toISOString().split('T')[0],
      completedTimeOnly: `${endTime.getHours()}:${endTime.getMinutes()}`,
      completedTime: endTime.toISOString(),
      name: studentName,
      grade: studentGrade,
      studentId,                            // ✅ Save studentId
      subject: selectedExam.subject || '',  // ✅ Save subject
      exam,
      score,
      percentage,
      attempts: updatedAttempts,
      timeSpent: timeSpentFormatted,
      answers: answerData
    };

    try {
      await addDoc(collection(db, 'examResults'), result);
      console.log("✅ Result saved to Firestore");
    } catch (err) {
      console.error('❌ Failed to save exam result:', err);
    }

    localStorage.setItem(attemptsKey, updatedAttempts.toString());
    localStorage.setItem(`${studentName}_${examTitle}_lastAttempt`, endTime.toISOString());

    addResult(result);
    navigate('/results');
  };

  // ✅ Timer logic
  useEffect(() => {
    if (authenticated) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          if (prev === 300) alert('⚠️ 5 minutes left!');
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [authenticated]);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h2 className="text-2xl font-bold mb-6 text-center">Welcome {studentInfo.name} from {studentInfo.grade}</h2>

      {/* 🧠 Subject dropdown */}
      {!selectedExam && (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <label className="block font-semibold mb-1">Choose a subject:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((subject, idx) => (
                <option key={idx} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* 🧾 Exams for selected subject */}
          {availableExams.filter(e => e.subject === selectedSubject).length === 0 ? (
            <p className="text-red-500 text-center">No exams available for this subject.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableExams
                .filter(e => e.subject === selectedSubject)
                .map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white border p-4 rounded shadow cursor-pointer hover:shadow-md"
                    onClick={() => handleSelectExam(exam)}
                  >
                    <h4 className="font-semibold text-center">{exam.title}</h4>
                    <p className="text-sm text-center text-gray-500">{exam.subject}</p>
                  </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✍️ Show exam form */}
      {authenticated && selectedExam && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-center text-blue-700 mb-4">{selectedExam.title}</h2>
          <div className="text-center text-2xl mb-6 text-red-600 font-mono">
            Time Left: {formatTime(timeLeft)}
          </div>

          {!submitted ? (
            <form className="space-y-6">
              {currentQuestions.map((q, index) => (
                <div key={q.id} className="bg-white p-4 rounded shadow">
                  <h3 className="font-semibold">Q{index + 1}: {q.question}</h3>
                  {q.type === 'mcq' ? (
                    <div className="mt-2 space-y-2">
                      {q.options?.map((opt, i) => (
                        <label key={i} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={opt}
                            onChange={() => handleChange(q.id, opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      className="w-full mt-2 p-2 border rounded"
                      rows={3}
                      placeholder="Type your answer here..."
                      onChange={(e) => handleChange(q.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  Swal.fire({
                    title: 'Submit Exam?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Submit',
                    cancelButtonText: 'No',
                  }).then((res) => res.isConfirmed && handleSubmit())
                }
                className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Submit Exam
              </button>
            </form>
          ) : (
            <div className="text-center mt-10 text-xl font-semibold text-gray-600">
              Submitting exam...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
