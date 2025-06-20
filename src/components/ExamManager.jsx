import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { auth, signInAnonymously, db } from '../utils/firebase';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';


export default function ExamManager() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const teacherInfo = JSON.parse(localStorage.getItem('teacherInfo') || '{}');
  const teacherSubject = teacherInfo.subject || '';
  const teacherName = teacherInfo.name || '';  
  const navigate = useNavigate();

  // ✅ Authenticate and fetch only this teacher's exams
  useEffect(() => {
    const authenticateAndFetch = async () => {
      try {
        await signInAnonymously(auth);

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (!user) return;

          const q = query(
            collection(db, 'exams'),
            where('subject', '==', teacherSubject),
            where('createdBy', '==', teacherName)
          );

          const snapshot = await getDocs(q);
          const fetchedExams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          setExams(fetchedExams);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("❌ Auth or fetch error:", err);
        setLoading(false);
      }
    };

    authenticateAndFetch();
  }, [teacherSubject, teacherName]);

  // ✅ Delete exam
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

  // ✅ Edit exam — PASSWORD REMOVED
  const handleEdit = async (exam) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Exam',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Title" value="${exam.title}">
        <input id="swal-grade" class="swal2-input" placeholder="Grade" value="${exam.grade}">
        <input id="swal-time" class="swal2-input" type="number" placeholder="Time Limit (minutes)" value="${exam.timeLimit || ''}">
      `,
      focusConfirm: false,
      preConfirm: () => {
        return {
          title: document.getElementById('swal-title').value,
          grade: document.getElementById('swal-grade').value,
          timeLimit: Number(document.getElementById('swal-time').value),
        };
      }
    });

    if (formValues) {
      await updateDoc(doc(db, 'exams', exam.id), {
        title: formValues.title,
        grade: formValues.grade,
        timeLimit: formValues.timeLimit
      });

      const updated = exams.map(e => e.id === exam.id ? { ...e, ...formValues } : e);
      setExams(updated);

      Swal.fire('✅ Updated!', 'Exam updated successfully.', 'success');
    }
  };

  // ✅ Navigate to edit questions
  const handleEditQuestions = (examId) => {
    navigate(`/edit-questions/${examId}`);
  };


   // ✅ LOGOUT FUNCTION — signs out securely, clears localStorage, redirects
   const handleLogout = async () => {
    const confirm = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
    });
    if (confirm.isConfirmed) {
      await signOut(auth); // ✅ Firebase sign out
      localStorage.clear(); // ✅ Remove any cached IDs & names
      navigate('/'); // ✅ Go back to Landing Page
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
              <p className="text-sm mb-1"><strong>Time Limit:</strong> {exam.timeLimit || 'Not set'} minutes</p>

              <div className="flex gap-3 mt-3">
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
                <button
                  onClick={() => handleEditQuestions(exam.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Edit Questions
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LOGOUT BUTTON */}
      <div className="text-center">
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
