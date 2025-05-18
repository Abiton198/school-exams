import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Swal from 'sweetalert2';
import StatisticsPanel from './StatisticsPanel';

export default function AllResults() {
  const [results, setResults] = useState([]);
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { value: password, isConfirmed } = await Swal.fire({
        title: 'Admin Access Required',
        input: 'password',
        inputLabel: 'Enter admin password',
        inputPlaceholder: 'Password',
        showCancelButton: true,
        confirmButtonText: 'Enter',
        allowOutsideClick: false,
      });

      if (isConfirmed && password === 'admin123') {
        setAccessGranted(true);
        onSnapshot(collection(db, 'examResults'), (snapshot) => {
          const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setResults(fetched);
        });
      }
      setAccessChecked(true);
    };

    checkAdmin();
  }, []);

  if (!accessChecked) return <div className="pt-28 text-center">Checking access...</div>;
  if (!accessGranted) return <div className="pt-28 text-center text-red-600">Access denied.</div>;

  const handleManualMarking = async (result) => {
    const updatedAnswers = await Promise.all(
      result.answers.map(async (a) => {
        if (a.type !== 'written') return a;

        const { value: mark } = await Swal.fire({
          title: `Q: ${a.question}`,
          input: 'range',
          inputAttributes: {
            min: 0,
            max: a.maxMark || 5,
            step: 1,
          },
          inputLabel: `Mark out of ${a.maxMark || 5}`,
          showCancelButton: true,
        });

        return {
          ...a,
          teacherMark: Number(mark),
        };
      })
    );

    const totalWritten = updatedAnswers.reduce((sum, a) =>
      a.type === 'written' ? sum + (a.teacherMark || 0) : sum, 0
    );
    const autoScore = updatedAnswers.reduce((sum, a) =>
      a.type === 'mcq' && a.answer === a.correctAnswer ? sum + 1 : sum, 0
    );

    const maxWritten = updatedAnswers.reduce((sum, a) =>
      a.type === 'written' ? sum + (a.maxMark || 5) : sum, 0
    );

    const totalPossible = (result.answers.length - updatedAnswers.filter(a => a.type === 'written').length) + maxWritten;
    const finalPercentage = (((autoScore + totalWritten) / totalPossible) * 100).toFixed(2);

    await updateDoc(doc(db, 'examResults', result.id), {
      answers: updatedAnswers,
      score: autoScore + totalWritten,
      percentage: finalPercentage,
    });

    Swal.fire('✅ Marking complete', `Final %: ${finalPercentage}%`, 'success');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pt-28">
      <h1 className="text-2xl font-bold text-center mb-6">📊 All Student Results</h1>

      {/* 📈 Stats + Charts */}
      <StatisticsPanel results={results} />

      <table className="w-full table-auto border border-gray-300 mt-6">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Grade</th>
            <th className="p-2 border">Exam</th>
            <th className="p-2 border">Score</th>
            <th className="p-2 border">%</th>
            <th className="p-2 border">Attempts</th>
            <th className="p-2 border">Time</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className="text-center hover:bg-gray-100">
              <td className="p-2 border">{r.name}</td>
              <td className="p-2 border">{r.grade}</td>
              <td className="p-2 border">{r.exam}</td>
              <td className="p-2 border">{r.score}</td>
              <td className={`p-2 border ${r.percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>{r.percentage}%</td>
              <td className="p-2 border">{r.attempts}</td>
              <td className="p-2 border">{r.timeSpent}</td>
              <td className="p-2 border space-x-2">
                <button className="text-blue-600 underline" onClick={() => setSelectedResult(r)}>View</button>
                <button className="text-purple-600 underline" onClick={() => handleManualMarking(r)}>Mark</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* View Answer Modal */}
      {selectedResult && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh] relative">
            <h3 className="text-xl font-semibold mb-4">Answers by {selectedResult.name}</h3>
            <ul className="space-y-3">
              {selectedResult.answers.map((a, idx) => (
                <li key={idx} className="border p-3 rounded shadow-sm">
                  <p><strong>Q{idx + 1}:</strong> {a.question}</p>
                  <p><strong>Answer:</strong> {a.answer}</p>
                  {a.type === 'mcq' && <p><strong>Correct:</strong> {a.correctAnswer}</p>}
                  {a.type === 'written' && a.teacherMark != null && (
                    <p><strong>Mark:</strong> {a.teacherMark} / {a.maxMark}</p>
                  )}
                </li>
              ))}
            </ul>
            <button onClick={() => setSelectedResult(null)} className="absolute top-2 right-4 text-2xl font-bold text-gray-500 hover:text-red-600">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
