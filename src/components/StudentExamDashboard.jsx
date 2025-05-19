// src/components/StudentExamDashboard.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

export default function StudentExamDashboard({ studentInfo }) {
  const [groupedExams, setGroupedExams] = useState({});
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExamsAndResults = async () => {
      const examSnapshot = await getDocs(collection(db, 'exams'));
      const allExams = examSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const resultSnapshot = await getDocs(collection(db, 'examResults'));
      const allResults = resultSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const studentGrade = studentInfo?.grade?.replace('Grade ', '') || '';
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

      // Get only results for this student
      const studentResults = allResults.filter(r => r.name === studentInfo?.name);
      setGroupedExams(grouped);
      setStudentResults(studentResults);
    };

    fetchExamsAndResults();
  }, [studentInfo]);

  const handleExamClick = async (exam) => {
    const studentName = studentInfo?.name;
    const attemptsKey = `${studentName}_${exam.title}_attempts`;

    const attempts = parseInt(localStorage.getItem(attemptsKey)) || 0;
    if (attempts >= 3) {
      Swal.fire('⛔ Max Attempts', 'You have already taken this exam 3 times.', 'error');
      return;
    }

    const { value: inputPassword } = await Swal.fire({
      title: `Enter Password for "${exam.title}"`,
      input: 'password',
      inputPlaceholder: 'Exam password',
      showCancelButton: true,
      confirmButtonText: 'Enter',
    });

    if (inputPassword === exam.password) {
      localStorage.setItem('examTitle', exam.title);
      localStorage.setItem('examStartTime', new Date().toISOString());
      navigate('/exam');
    } else if (inputPassword) {
      Swal.fire('❌ Wrong Password', 'Please try again.', 'error');
    }
  };

  const getAttempts = (exam) => {
    const key = `${studentInfo?.name}_${exam.title}_attempts`;
    return parseInt(localStorage.getItem(key)) || 0;
  };

  const getLastAttempt = (exam) => {
    const key = `${studentInfo?.name}_${exam.title}_lastAttempt`;
    const dateStr = localStorage.getItem(key);
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const getLastMark = (exam) => {
    const matching = studentResults
      .filter(r => r.exam === exam.title)
      .sort((a, b) => new Date(b.completedTime) - new Date(a.completedTime));
    return matching[0]?.percentage ? `${matching[0].percentage}%` : 'N/A';
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
                {exams.map((exam, i) => (
                  <div
                    key={i}
                    className="p-4 border border-gray-200 rounded-lg bg-white shadow hover:shadow-lg transition cursor-pointer hover:bg-blue-50"
                    onClick={() => handleExamClick(exam)}
                  >
                    <h4 className="font-bold text-blue-800">{exam.title}</h4>
                    <p className="text-sm text-gray-600">Subject: {subject}</p>
                    <p className="text-xs text-gray-400">Grade: {exam.grade}</p>
                    <p className="text-xs mt-1 text-green-700">Attempts: {getAttempts(exam)} / 3</p>
                    <p className="text-xs text-gray-500">Last: {getLastAttempt(exam)}</p>
                    <p className="text-xs text-purple-600 font-semibold">
                      Last Mark: {getLastMark(exam)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
