import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db, signInAnonymously } from '../utils/firebase';

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function ExamPage({ studentInfo, addResult }) {
  const navigate = useNavigate();
  const [availableExams, setAvailableExams] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [viewing, setViewing] = useState(''); // 'exams' or 'results'
  const [selectedExam, setSelectedExam] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [examResults, setExamResults] = useState([]);
  const currentQuestions = selectedExam?.questions || [];

  // Predefined list of subjects
  const subjects = ['Mathematics', 'LO', 'English', 'History', 'Geography', 'CAT', 'Afrikans', 'Business', 'Physics','Creative Arts', 'Xhosa'];

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
  }, []);

  useEffect(() => {
    if (!studentInfo) {
      navigate('/');
      return;
    }

    localStorage.setItem('studentName', studentInfo.name);
    localStorage.setItem('studentGrade', studentInfo.grade);
    localStorage.setItem('studentId', studentInfo.studentId);

    const fetchData = async () => {
      const examSnap = await getDocs(collection(db, 'exams'));
      const exams = examSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const gradeExams = exams.filter(e => e.grade?.replace("Grade ", "") === studentInfo.grade?.replace("Grade ", ""));

      setAvailableExams(gradeExams);

      // fetching results from firestore
      const resultSnap = await getDocs(collection(db, 'examResults'));
      const results = resultSnap.docs.map(doc => doc.data());
      const studentResults = results.filter(r => r.name === studentInfo.name);
      setExamResults(studentResults);
    };

    fetchData();
  }, [studentInfo, navigate]);

  const handleSelectExam = async (exam) => {
    const studentName = localStorage.getItem('studentName');
    const attemptsKey = `${studentName}_${exam.title}_attempts`;
    const attempts = parseInt(localStorage.getItem(attemptsKey)) || 0;

    if (attempts >= 3) {
      Swal.fire('⛔', 'You have already attempted this exam 3 times.', 'error');
      return;
    }

    const { value: password } = await Swal.fire({
      title: `Enter Password for ${exam.title}`,
      input: 'password',
      inputPlaceholder: 'Password',
      showCancelButton: true,
    });

    if (password === exam.password) {
      setSelectedExam(exam);
      setAuthenticated(true);
      localStorage.setItem('examTitle', exam.title);
      localStorage.setItem('examStartTime', new Date().toISOString());
    } else if (password) {
      Swal.fire('❌', 'Incorrect password.', 'error');
    }
  };

  const handleChange = (id, answer) => {
    setAnswers(prev => ({ ...prev, [id]: answer }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < currentQuestions.length) {
      alert('❗ You must answer all questions before submitting.');
      return;
    }

    setSubmitted(true);

    const endTime = new Date();
    const startTime = new Date(localStorage.getItem('examStartTime') || new Date());
    const timeSpent = Math.round((endTime - startTime) / 1000);
    const timeFormatted = `${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`;

    const studentId = localStorage.getItem('studentId');
    const studentName = localStorage.getItem('studentName');
    const studentGrade = localStorage.getItem('studentGrade');
    const examTitle = localStorage.getItem('examTitle');

    let score = 0;
    let totalPossible = 0;

    const answerData = currentQuestions.map((q) => {
      const isCorrect = answers[q.id] === q.correctAnswer;
      const maxMark = q.type === 'written' ? parseInt(q.maxMark || 5) : 1;
      totalPossible += maxMark;
      if (q.type === 'mcq' && isCorrect) score += 1;
      return {
        question: q.question,
        answer: answers[q.id],
        correctAnswer: q.correctAnswer,
        maxMark,
        type: q.type || 'mcq',
        teacherMark: q.type === 'written' ? null : undefined
      };
    });

    const percentage = ((score / totalPossible) * 100).toFixed(2);
    const result = {
      completedDate: endTime.toISOString().split('T')[0],
      completedTime: endTime.toISOString(),
      completedTimeOnly: `${endTime.getHours()}:${endTime.getMinutes()}`,
      studentId,
      name: studentName,
      grade: studentGrade,
      exam: examTitle,
      subject: selectedExam.subject || '',
      score,
      percentage,
      attempts: (parseInt(localStorage.getItem(`${studentName}_${examTitle}_attempts`)) || 0) + 1,
      timeSpent: timeFormatted,
      answers: answerData,
    };

    await addDoc(collection(db, 'examResults'), result);
    addResult(result);
    localStorage.setItem(`${studentName}_${examTitle}_attempts`, result.attempts);
    localStorage.setItem(`${studentName}_${examTitle}_lastAttempt`, endTime.toISOString());
    navigate('/results');
  };

  useEffect(() => {
    if (authenticated) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [authenticated]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        Welcome, {studentInfo.name} ({studentInfo.grade})
      </h1>

      {/* Subject Cards */}
      {!selectedExam && !viewing && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">Select a Subject</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {subjects.map((subject, idx) => (
              <div
                key={idx}
                className="bg-white border p-6 rounded shadow cursor-pointer hover:shadow-md text-center"
                onClick={() => {
                  setSelectedSubject(subject);
                  setViewing('');
                }}
              >
                <h3 className="text-lg font-bold text-blue-700">{subject}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Cards */}
      {selectedSubject && !viewing && (
        <div className="max-w-3xl mx-auto mt-10">
          <h2 className="text-xl font-semibold mb-4 text-center">What would you like to do in {selectedSubject}?</h2>
          <div className="flex gap-6 justify-center">
            <div
              className="bg-blue-100 hover:bg-blue-200 p-6 rounded shadow cursor-pointer text-center w-40"
              onClick={() => setViewing('exams')}
            >
              <h3 className="font-bold text-blue-800">📘 Take Exam</h3>
            </div>
            <div
              className="bg-green-100 hover:bg-green-200 p-6 rounded shadow cursor-pointer text-center w-40"
              onClick={() => setViewing('results')}
            >
              <h3 className="font-bold text-green-800">📄 View Results</h3>
            </div>
          </div>
        </div>
      )}

      {/* Exam List */}
      {viewing === 'exams' && !selectedExam && (
        <div className="max-w-4xl mx-auto mt-10">
          <h2 className="text-xl font-semibold mb-4 text-center">Available Exams in {selectedSubject}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableExams.filter(e => e.subject === selectedSubject).map((exam) => (
              <div
                key={exam.id}
                className="bg-white border p-4 rounded shadow cursor-pointer hover:shadow-md"
                onClick={() => handleSelectExam(exam)}
              >
                <h4 className="font-semibold">{exam.title}</h4>
                <p className="text-sm text-gray-500">{exam.subject}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results List */}
      {viewing === 'results' && (
               <div className="max-w-3xl mx-auto mt-10">
               <h2 className="text-xl font-semibold mb-4 text-center">Your Results in {selectedSubject}</h2>
               {examResults.filter(r => r.subject?.toLowerCase().trim() === selectedSubject.toLowerCase().trim()).length === 0 ? (
                 <p className="text-gray-600 text-center">No results yet for this subject.</p>
               ) : (
                 <ul className="space-y-4">
                   {examResults
                     .filter(r => r.subject === selectedSubject)
                     .map((res, i) => (
                       <li key={i} className="bg-white p-4 rounded shadow">
                         <p><strong>Exam:</strong> {res.exam}</p>
                         <p><strong>Score:</strong> {res.percentage}%</p>
                         <p><strong>Date:</strong> {res.completedDate}</p>
                         {res.feedback && (
                           <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-2">
                             <p><strong>Teacher Feedback:</strong> {res.feedback}</p>
                           </div>
                         )}
                       </li>
                   ))}
                 </ul>
               )}
               {/* Back to subject card option */}
               <div className="text-center mt-6">
                 <button
                   className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                   onClick={() => {
                     setSelectedSubject('');
                     setViewing('');
                   }}
                 >
                   🔙 Back to Subjects
                 </button>
               </div>
             </div>
           )}
     
           {/* 📝 Exam Form (Once Authenticated) */}
           {authenticated && selectedExam && (
             <div className="mt-10 max-w-4xl mx-auto">
               <h2 className="text-xl font-bold text-center text-blue-700 mb-4">{selectedExam.title}</h2>
               <div className="text-center text-2xl text-red-600 font-mono mb-6">
                 Time Left: {formatTime(timeLeft)}
               </div>
     
               {!submitted ? (
                 <form className="space-y-6">
                   {currentQuestions.map((q, i) => (
                     <div key={q.id} className="bg-white p-4 rounded shadow">
                       <h3 className="font-semibold">Q{i + 1}: {q.question}</h3>
                       {q.type === 'mcq' ? (
                         q.options.map((opt, j) => (
                           <label key={j} className="block mt-2">
                             <input
                               type="radio"
                               name={`q${q.id}`}
                               value={opt}
                               onChange={() => handleChange(q.id, opt)}
                             />{' '}
                             {opt}
                           </label>
                         ))
                       ) : (
                         <textarea
                           className="w-full mt-2 p-2 border rounded"
                           placeholder="Type your answer..."
                           onChange={(e) => handleChange(q.id, e.target.value)}
                         />
                       )}
                     </div>
                   ))}
     
                   <button
                     type="button"
                     className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700"
                     onClick={() =>
                       Swal.fire({
                         title: 'Submit Exam?',
                         icon: 'warning',
                         showCancelButton: true,
                         confirmButtonText: 'Submit',
                       }).then((res) => res.isConfirmed && handleSubmit())
                     }
                   >
                     ✅ Submit Exam
                   </button>
                 </form>
               ) : (
                 <div className="text-center mt-6 font-medium">📤 Submitting your exam...</div>
               )}
             </div>

             
           )}
         </div>
       );
     }
     
 
