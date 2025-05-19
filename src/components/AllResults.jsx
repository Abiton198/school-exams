import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Swal from 'sweetalert2';
import StatisticsPanel from './StatisticsPanel';

// 🧠 Helper: Calculate final score from written + mcq answers
function calculateUpdatedResult(result) {
  const updatedAnswers = result.answers.map((a) => {
    const answer = {
      ...a,
      teacherMark: a.type === 'written' ? parseInt(a.teacherMark || 0) : undefined,
    };
    Object.keys(answer).forEach((key) => {
      if (answer[key] === undefined) delete answer[key];
    });
    return answer;
  });

  const writtenTotal = updatedAnswers.filter(a => a.type === 'written').reduce((sum, a) => sum + (a.teacherMark || 0), 0);
  const maxWritten = updatedAnswers.filter(a => a.type === 'written').reduce((sum, a) => sum + (a.maxMark || 5), 0);
  const mcqScore = updatedAnswers.filter(a => a.type === 'mcq').reduce((sum, a) => {
    return a.teacherOverrideCorrect === true || a.answer === a.correctAnswer ? sum + 1 : sum;
  }, 0);

  const totalPossible = maxWritten + updatedAnswers.filter(a => a.type === 'mcq').length;
  const totalScore = writtenTotal + mcqScore;
  const finalPercentage = ((totalScore / totalPossible) * 100).toFixed(2);

  return {
    answers: updatedAnswers,
    score: totalScore,
    percentage: finalPercentage,
    marked: true // ✅ lock marking
  };
}

export default function AllResults() {
  const [results, setResults] = useState([]);
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [markingData, setMarkingData] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { value: password, isConfirmed } = await Swal.fire({
        title: 'Admin Access Required',
        input: 'password',
        inputLabel: 'Enter admin password',
        showCancelButton: true,
        inputPlaceholder: 'Password',
      });

      if (isConfirmed && password === 'admin123') {
        setAccessGranted(true);
        onSnapshot(collection(db, 'examResults'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setResults(fetched);
        });
      }
      setAccessChecked(true);
    };
    checkAdmin();
  }, []);

  if (!accessChecked) return <div className="pt-28 text-center">Checking access...</div>;
  if (!accessGranted) return <div className="pt-28 text-center text-red-600">Access denied.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 pt-28">
      <h1 className="text-2xl font-bold text-center mb-6">📊 All Student Results</h1>
      <StatisticsPanel results={results} />

      <table className="w-full table-auto border mt-6 border-gray-300">
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
                <button onClick={() => setSelectedResult(r)} className="text-blue-600 underline">View</button>
                <button
                  onClick={() => {
                    if (r.marked) {
                      Swal.fire('Locked', 'This exam has already been marked.', 'info');
                      return;
                    }
                    setMarkingData(r);
                  }}
                  className={`underline ${r.marked ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600'}`}
                  disabled={r.marked}
                >
                  Mark
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ View Modal */}
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

      {/* ✅ Marking Modal */}
      {markingData && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Marking: {markingData.name} - {markingData.exam}</h2>

            {markingData.answers.map((a, idx) => (
              <div key={idx} className="border p-4 mb-3 rounded">
                <p><strong>Q{idx + 1}:</strong> {a.question}</p>
                <p><strong>Answer:</strong> {a.answer}</p>
                {a.type === 'written' ? (
                  <>
                    <label className="block mt-2">Mark out of {a.maxMark || 5}:</label>
                    <input
                      type="number"
                      min={0}
                      max={a.maxMark || 5}
                      value={a.teacherMark ?? ''}
                      onChange={(e) => {
                        const updated = { ...markingData };
                        updated.answers[idx].teacherMark = parseInt(e.target.value || 0);
                        setMarkingData(updated);
                      }}
                      className="w-full p-2 border rounded mt-1"
                    />
                  </>
                ) : (
                  <>
                    <p><strong>Correct Answer:</strong> {a.correctAnswer}</p>
                    <label className="block mt-2">Mark as correct?</label>
                    <select
                      value={a.teacherOverrideCorrect ?? ''}
                      onChange={(e) => {
                        const updated = { ...markingData };
                        updated.answers[idx].teacherOverrideCorrect = e.target.value === 'true';
                        setMarkingData(updated);
                      }}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">-- Select --</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </>
                )}
              </div>
            ))}

            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={() => setMarkingData(null)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={async () => {
                  try {
                    const updated = calculateUpdatedResult(markingData);
                    await updateDoc(doc(db, 'examResults', markingData.id), updated);
                    Swal.fire('✅ Saved!', 'Marks updated successfully.', 'success');
                    setMarkingData(null);
                  } catch (err) {
                    console.error(err);
                    Swal.fire('Error', 'Could not save marks.', 'error');
                  }
                }}
              >
                Save Marks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
