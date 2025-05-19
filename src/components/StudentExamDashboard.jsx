import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function StudentExamDashboard({ studentInfo }) {
  const [groupedExams, setGroupedExams] = useState({});
  const [expandedSubject, setExpandedSubject] = useState(null);

  useEffect(() => {
    const fetchExams = async () => {
      const examsSnapshot = await getDocs(collection(db, 'exams'));
      const allExams = examsSnapshot.docs.map(doc => doc.data());

      const studentGrade = studentInfo?.grade?.replace('Grade ', '') || '';
      const filtered = allExams.filter(exam => exam.grade?.includes(studentGrade));

      // Group exams by subject
      const grouped = {};
      filtered.forEach(exam => {
        const subject = exam.subject || 'Uncategorized';
        if (!grouped[subject]) grouped[subject] = [];
        grouped[subject].push(exam);
      });

      setGroupedExams(grouped);
    };

    fetchExams();
  }, [studentInfo]);

  return (
    <div className="max-w-4xl mx-auto pt-24 px-4">
      <h2 className="text-2xl font-bold text-center mb-6">
        Welcome, {studentInfo?.name} ({studentInfo?.grade})
      </h2>

      {Object.keys(groupedExams).length === 0 ? (
        <p className="text-center text-gray-500">No exams available yet.</p>
      ) : (
        Object.keys(groupedExams).map(subject => (
          <div key={subject} className="mb-6 bg-white rounded shadow p-4">
            <h3
              onClick={() => setExpandedSubject(expandedSubject === subject ? null : subject)}
              className="text-lg font-semibold cursor-pointer text-blue-600"
            >
              {subject} Exams {expandedSubject === subject ? '▲' : '▼'}
            </h3>

            {expandedSubject === subject && (
              <div className="mt-3 space-y-2">
                {groupedExams[subject].map((exam, i) => (
                  <div
                    key={i}
                    className="p-3 border rounded hover:bg-blue-50 transition"
                  >
                    <p className="font-semibold">{exam.title}</p>
                    <p className="text-sm text-gray-500">Grade: {exam.grade}</p>
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
