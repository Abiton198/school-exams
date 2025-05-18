// src/components/ExamManager.jsx
import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, auth, signInAnonymously } from '../utils/firebase';
import Swal from 'sweetalert2';

export default function ExamManager() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    signInAnonymously(auth);

    const unsubscribe = onSnapshot(collection(db, 'exams'), (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setExams(list);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (exam) => {
    const confirm = await Swal.fire({
      title: `Delete "${exam.title}"?`,
      text: 'This action is permanent!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });

    if (confirm.isConfirmed) {
      await deleteDoc(doc(db, 'exams', exam.id));
      Swal.fire('Deleted!', 'Exam removed.', 'success');
    }
  };

  const previewQuestions = (exam) => {
    Swal.fire({
      title: `${exam.title} Questions`,
      html: exam.questions
        .map((q, i) => `<p><strong>Q${i + 1}:</strong> ${q.question}</p>`)
        .join(''),
      width: 600,
      confirmButtonText: 'Close'
    });
  };

  return (
    <div className="max-w-5xl mx-auto pt-28 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">📚 Manage All Exams</h2>

      {exams.length === 0 ? (
        <p className="text-center text-gray-500">No exams found.</p>
      ) : (
        <table className="w-full table-auto border border-gray-300">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Grade</th>
              <th className="p-2 border">Questions</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam, index) => (
              <tr key={index} className="text-center hover:bg-gray-50">
                <td className="p-2 border">{exam.title}</td>
                <td className="p-2 border">{exam.grade}</td>
                <td className="p-2 border">{exam.questions?.length || 0}</td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => previewQuestions(exam)}
                    className="text-blue-600 underline"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(exam)}
                    className="text-red-600 underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
