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
  const [markingData, setMarkingData] = useState(null);


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
        if (a.type === 'written') {
          const { value: selectedMark } = await Swal.fire({
            title: `Q: ${a.question}`,
            input: 'select',
            inputOptions: [...Array((a.maxMark || 5) + 1).keys()].reduce((acc, num) => {
              acc[num] = `${num} mark${num !== 1 ? 's' : ''}`;
              return acc;
            }, {}),
            inputLabel: `Mark out of ${a.maxMark || 5}`,
            inputValue: a.teacherMark ?? 0,
            showCancelButton: true,
          });
  
          return {
            ...a,
            teacherMark: parseInt(selectedMark),
          };
        }
  
        // For MCQs - teacher can manually confirm correctness
        if (a.type === 'mcq') {
          const { isConfirmed } = await Swal.fire({
            title: `Q: ${a.question}`,
            html: `
              <p><strong>Student's Answer:</strong> ${a.answer}</p>
              <p><strong>Correct Answer:</strong> ${a.correctAnswer}</p>
              <p>Is this answer correct?</p>
            `,
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
          });
  
          return {
            ...a,
            teacherOverrideCorrect: isConfirmed
          };
        }
  
        return a;
      })
    );
  
    // Recalculate scores
    const writtenTotal = updatedAnswers
      .filter(a => a.type === 'written')
      .reduce((sum, a) => sum + (a.teacherMark || 0), 0);
  
    const maxWritten = updatedAnswers
      .filter(a => a.type === 'written')
      .reduce((sum, a) => sum + (a.maxMark || 5), 0);
  
    const mcqScore = updatedAnswers
      .filter(a => a.type === 'mcq')
      .reduce((sum, a) => {
        if (a.teacherOverrideCorrect === true) return sum + 1;
        return a.answer === a.correctAnswer ? sum + 1 : sum;
      }, 0);
  
    const totalPossible = maxWritten + updatedAnswers.filter(a => a.type === 'mcq').length;
    const totalScore = writtenTotal + mcqScore;
    const finalPercentage = ((totalScore / totalPossible) * 100).toFixed(2);
  
    await updateDoc(doc(db, 'examResults', result.id), {
      answers: updatedAnswers,
      score: totalScore,
      percentage: finalPercentage
    });
  
    Swal.fire('✅ Final Mark Saved', `Student's Final %: ${finalPercentage}%`, 'success');
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

              {r.answers?.some(a => a.type === 'written' && a.teacherMark == null) && (
                <button
                  onClick={() => setMarkingData(r)}
                  className="text-yellow-600 underline"
                >
                  Mark
                </button>
                )}
            </tr>
          ))}
        </tbody>
      </table>

      {markingData && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Marking: {markingData.name} - {markingData.exam}</h2>
      {markingData.answers.filter(a => a.type === 'written').map((a, idx) => (
        <div key={idx} className="border p-4 mb-3 rounded">
          <p><strong>Question:</strong> {a.question}</p>
          <p><strong>Student Answer:</strong> {a.answer}</p>
          <label className="block mt-2 font-medium">Teacher Mark (out of {a.maxMark || 5}):</label>
          <input
            type="number"
            min={0}
            max={a.maxMark || 5}
            value={a.teacherMark ?? ''}
            onChange={(e) => {
              const updated = { ...markingData };
              updated.answers[idx].teacherMark = e.target.value;
              setMarkingData(updated);
            }}
            className="w-full border px-3 py-1 rounded mt-1"
          />
        </div>
      ))}

      <div className="mt-6 flex justify-end space-x-4">
        <button onClick={() => setMarkingData(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
          Cancel
        </button>
        <button
          onClick={async () => {
            const updatedResult = calculateUpdatedResult(markingData);
            try {
              const docRef = collection(db, 'examResults');
              const querySnap = await getDocs(docRef);
              const docToUpdate = querySnap.docs.find(doc =>
                doc.data().name === markingData.name &&
                doc.data().exam === markingData.exam &&
                doc.data().completedTime === markingData.completedTime
              );
              if (docToUpdate) {
                await docToUpdate.ref.update(updatedResult);
                Swal.fire('Saved!', 'Marks updated successfully ✅', 'success');
                setMarkingData(null);
              } else {
                Swal.fire('Error', 'Document not found', 'error');
              }
            } catch (err) {
              console.error(err);
              Swal.fire('Error', 'Could not save marks', 'error');
            }
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Save Marks
        </button>
      </div>
    </div>
  </div>
)}


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
