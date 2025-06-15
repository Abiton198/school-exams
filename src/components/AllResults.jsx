import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Swal from 'sweetalert2';
import StatisticsPanel from './StatisticsPanel';
import { useNavigate } from 'react-router-dom';

// 🔧 Helper: Calculate updated scores and percentage
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

  const writtenTotal = updatedAnswers
    .filter(a => a.type === 'written')
    .reduce((sum, a) => sum + (a.teacherMark || 0), 0);

  const maxWritten = updatedAnswers
    .filter(a => a.type === 'written')
    .reduce((sum, a) => sum + (a.maxMark || 5), 0);

  const mcqScore = updatedAnswers
    .filter(a => a.type === 'mcq')
    .reduce((sum, a) =>
      a.teacherOverrideCorrect === true || a.answer === a.correctAnswer ? sum + 1 : sum,
    0);

  const totalPossible = maxWritten + updatedAnswers.filter(a => a.type === 'mcq').length;
  const totalScore = writtenTotal + mcqScore;
  const finalPercentage = ((totalScore / totalPossible) * 100).toFixed(2);

  return {
    answers: updatedAnswers,
    score: totalScore,
    percentage: finalPercentage,
    marked: true
  };
}

export default function AllResults() {
  const [results, setResults] = useState([]);
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [markingData, setMarkingData] = useState(null);
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  // ✅ Admin access: Name dropdown instead of password
  useEffect(() => {
    const askAdminName = async () => {
      const { value: name } = await Swal.fire({
        title: 'Admin Login',
        input: 'select',
        inputOptions: {
          'Mr. Abiton': 'Abiton',
          'Mr. Chris': 'Chris',
          'Principal ': 'Lavonne'
        },
        inputPlaceholder: 'Select your name',
        showCancelButton: true,
        confirmButtonText: 'Continue',
        inputValidator: (value) => {
          if (!value) return 'Please select a name.';
        }
      });

      if (name) {
        setAccessGranted(true);
        // 🔄 Listen to real-time updates in examResults
        onSnapshot(collection(db, 'examResults'), (snapshot) => {
          const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setResults(fetched);
        });
      }

      setAccessChecked(true);
    };
    askAdminName();
  }, []);

  if (!accessChecked) return <div className="pt-28 text-center">Checking access...</div>;
  if (!accessGranted) return <div className="pt-28 text-center text-red-600">Access denied.</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 pt-28">
      <h1 className="text-2xl font-bold text-center mb-6">📊 All Student Results</h1>
      <StatisticsPanel results={results} />

      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/teacher-dashboard')}
          className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
        >
          Teacher
        </button>
        <button
          onClick={() => navigate('/exam-manager')}
          className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
        >
          🛠 Exam Manager
        </button>
      </div>

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
                    setMarkingData(r);
                    setFeedback(r.feedback || '');
                  }}
                  className="text-purple-600 underline"
                >
                  {r.marked ? 'Edit Feedback' : 'Mark'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🧾 View Modal */}
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
            {selectedResult.feedback && (
              <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-600 p-3">
                <p><strong>Teacher Feedback:</strong> {selectedResult.feedback}</p>
              </div>
            )}
            <button onClick={() => setSelectedResult(null)} className="absolute top-2 right-4 text-2xl font-bold text-gray-500 hover:text-red-600">×</button>
          </div>
        </div>
      )}

      {/* ✍️ Marking / Feedback Modal */}
      {markingData && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {markingData.marked ? 'Edit Feedback' : 'Marking'}: {markingData.name} - {markingData.exam}
            </h2>

            {/* Editable feedback */}
            <div className="mb-4">
              <label className="block font-semibold mb-1">Teacher Feedback:</label>
              <textarea
                rows={4}
                className="w-full border p-2 rounded"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter comments for the student..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={() => setMarkingData(null)} className="bg-gray-300 px-4 py-2 rounded">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const updateData = markingData.marked
                      ? { feedback: feedback.trim() }
                      : {
                          ...calculateUpdatedResult(markingData),
                          feedback: feedback.trim()
                        };
                    await updateDoc(doc(db, 'examResults', markingData.id), updateData);
                    Swal.fire('✅ Saved', 'Feedback/Marks saved successfully.', 'success');
                    setMarkingData(null);
                  } catch (err) {
                    console.error(err);
                    Swal.fire('Error', 'Could not update data.', 'error');
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                {markingData.marked ? 'Update Feedback' : 'Save Marks & Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
