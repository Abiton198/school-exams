import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../utils/firebase'; // ✅ Correct Firebase imports!
import Swal from 'sweetalert2';
import { signOut } from 'firebase/auth'; // ✅ Ensure signOut is imported

export default function StudentExamDashboard({ studentInfo }) {
  const [groupedExams, setGroupedExams] = useState({});
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const navigate = useNavigate();

  // ✅ Fetch exams + results once studentInfo is ready
  useEffect(() => {
    if (!studentInfo) {
      navigate('/'); // fallback: redirect home if no info
      return;
    }

    const fetchData = async () => {
      const examSnap = await getDocs(collection(db, 'exams'));
      const allExams = examSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const resultSnap = await getDocs(collection(db, 'examResults'));
      const allResults = resultSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter exams for this grade
      const studentGrade = studentInfo.grade?.replace('Grade ', '');
      const filteredExams = allExams.filter(exam =>
        exam.grade?.replace('Grade ', '') === studentGrade
      );

      // Group by subject
      const grouped = {};
      filteredExams.forEach(exam => {
        const subject = exam.subject || 'Other';
        if (!grouped[subject]) grouped[subject] = [];
        grouped[subject].push(exam);
      });

      // Filter results for this student
      const studentFilteredResults = allResults.filter(r => r.name === studentInfo.name);

      setGroupedExams(grouped);
      setStudentResults(studentFilteredResults);
    };

    fetchData();
  }, [studentInfo, navigate]);

  // ✅ Handle exam click
  const handleExamClick = async (exam) => {
    const attemptsKey = `${studentInfo.name}_${exam.title}_attempts`;
    const attempts = parseInt(localStorage.getItem(attemptsKey)) || 0;

    if (attempts >= 3) {
      Swal.fire('⛔ Max Attempts', 'You have already taken this exam 3 times.', 'error');
      return;
    }

    const confirm = await Swal.fire({
      title: `Start "${exam.title}"?`,
      text: `You have ${3 - attempts} attempt(s) left.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Start Exam',
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#dc2626',
    });

    if (confirm.isConfirmed) {
      localStorage.setItem('examTitle', exam.title);
      localStorage.setItem('examStartTime', new Date().toISOString());
      navigate('/exam');
    }
  };

  const getAttempts = (exam) => {
    const key = `${studentInfo.name}_${exam.title}_attempts`;
    return parseInt(localStorage.getItem(key)) || 0;
  };

  const getLastAttempt = (exam) => {
    const key = `${studentInfo.name}_${exam.title}_lastAttempt`;
    const dateStr = localStorage.getItem(key);
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const getLastResult = (exam) => {
    const results = studentResults
      .filter(r => r.exam === exam.title)
      .sort((a, b) => new Date(b.completedTime) - new Date(a.completedTime));
    return results[0] || null;
  };

  const getCardColor = (percentage) => {
    if (percentage >= 50) return 'border-green-500 bg-green-50';
    if (percentage > 0 && percentage < 50) return 'border-red-500 bg-red-50';
    return 'border-gray-300 bg-white';
  };

  const getStatusBadge = (percentage) => {
    if (percentage >= 50) return <span className="px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-200 rounded">✅ Passed</span>;
    if (percentage > 0 && percentage < 50) return <span className="px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-200 rounded">❌ Failed</span>;
    return <span className="px-2 py-0.5 text-xs font-semibold text-gray-700 bg-gray-200 rounded">🆕 New</span>;
  };

  const renderCircleProgress = (attempts) => {
    const radius = 18;
    const stroke = 4;
    const normalizedRadius = radius - stroke * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const percent = Math.min(attempts / 3, 1);
    const strokeDashoffset = circumference - percent * circumference;

    const color = attempts === 0 ? '#9CA3AF'
      : attempts === 1 ? '#FBBF24'
      : '#EF4444';

    return (
      <svg height={radius * 2} width={radius * 2} className="block mx-auto">
        <circle
          stroke="#E5E7EB"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.35s' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          className="text-xs fill-gray-700 font-bold"
        >
          {attempts}/3
        </text>
      </svg>
    );
  };

  // ✅ Logout
  const handleLogout = async () => {
    const confirm = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (confirm.isConfirmed) {
      await signOut(auth);
      localStorage.clear();
      navigate('/');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-24 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        👋 Welcome, {studentInfo?.name} ({studentInfo?.grade})
      </h2>

      {Object.keys(groupedExams).length === 0 ? (
        <p className="text-center text-gray-500">No exams available right now.</p>
      ) : (
        Object.entries(groupedExams).map(([subject, exams]) => (
          <div key={subject} className="mb-6">
            <h3
              onClick={() => setExpandedSubject(expandedSubject === subject ? null : subject)}
              className="text-lg font-semibold cursor-pointer text-blue-700 mb-2"
            >
              {expandedSubject === subject ? '▼' : '▶'} {subject}
            </h3>

            {expandedSubject === subject && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {exams.map((exam, i) => {
                  const lastResult = getLastResult(exam);
                  const attempts = getAttempts(exam);
                  const percentage = lastResult?.percentage ? parseFloat(lastResult.percentage) : 0;
                  return (
                    <div
                      key={i}
                      onClick={() => handleExamClick(exam)}
                      className={`p-4 border rounded-lg shadow hover:shadow-lg transition cursor-pointer hover:bg-blue-50 ${getCardColor(percentage)}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-blue-800">{exam.title}</h4>
                        {getStatusBadge(percentage)}
                      </div>
                      <p className="text-sm text-gray-600">Subject: {subject}</p>
                      <p className="text-xs text-gray-400">Grade: {exam.grade}</p>

                      <div className="flex justify-center my-3">{renderCircleProgress(attempts)}</div>

                      <p className="text-xs text-gray-500 text-center">Last Attempt: {getLastAttempt(exam)}</p>
                      <p className="text-xs text-purple-600 font-semibold text-center">
                        Last Mark: {lastResult?.percentage ? `${lastResult.percentage}%` : 'N/A'}
                      </p>
                      {lastResult?.feedback && (
                        <p className="text-xs text-yellow-700 mt-1 text-center">
                          💬 <strong>Feedback:</strong> {lastResult.feedback}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}

      <div className="text-center mt-8">
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
