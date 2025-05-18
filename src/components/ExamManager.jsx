// src/components/ExamManager.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Swal from 'sweetalert2';

export default function ExamManager() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const teacherSubject = localStorage.getItem('teacherSubject') || '';
  const teacherName = localStorage.getItem('teacherName') || '';

  // Fetch exams matching the subject of the logged-in teacher
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const q = query(
          collection(db, 'exams'),
          where('subject', '==', teacherSubject)
        );
        const snapshot = await getDocs(q);
        const fetchedExams = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setExams(fetchedExams);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching exams:', err);
        setLoading(false);
      }
    };

    fetchExams();
  }, [teacherSubject]);

  // Handle deleting an exam
  const handleDelete = async (examId) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the exam.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });

    if (confirm.isConfirmed) {
      await deleteDoc(doc(db, 'exams', examId));
      setExams(exams.filter(e => e.id !== examId));
      Swal.fire('Deleted!', 'Exam has been deleted.', 'success');
    }
  };

  // Handle editing exam title or password
  const handleEdit = async (exam) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Exam',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Title" value="${exam.title}">
        <input id="swal-password" class="swal2-input" placeholder="Password" value="${exam.password}">
      `,
      focusConfirm: false,
      preConfirm: () => {
        return {
          title: document.getElementById('swal-title').value,
          password: document.getElementById('swal-password').value
        };
      }
    });

    if (formValues) {
      await updateDoc(doc(db, 'exams', exam.id), {
        title: formValues.title,
        password: formValues.password
      });

      const updated = exams.map(e => e.id === exam.id ? { ...e, ...formValues } : e);
      setExams(updated);

      Swal.fire('✅ Updated!', 'Exam updated successfully.', 'success');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-28 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
        🧑‍🏫 {teacherName}'s Exams ({teacherSubject})
      </h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading your exams...</p>
      ) : exams.length === 0 ? (
        <p className="text-center text-red-500">No exams created yet.</p>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam, i) => (
            <div key={i} className="bg-white p-4 rounded shadow-md border">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{exam.title}</h3>
                <span className="text-sm text-gray-500">Grade: {exam.grade}</span>
              </div>
              <p className="text-sm mb-1"><strong>Subject:</strong> {exam.subject}</p>
              <p className="text-sm mb-3"><strong>Password:</strong> {exam.password}</p>

              <div className="flex gap-4">
                <button
                  onClick={() => handleEdit(exam)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(exam.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
