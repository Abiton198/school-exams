// ✅ ParentDashboard.jsx — Fully Updated with `setDoc` fix & best practices

import React, { useEffect, useState } from 'react';
import { db, auth } from '../utils/firebase';
import {
  doc,
  getDoc,
  setDoc,   // ✅ Correctly imported
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import ParentChatBox from '../utils/ParentChatBox';
import Swal from 'sweetalert2';

export default function ParentDashboard() {
  const navigate = useNavigate();

  const [parentId, setParentId] = useState(localStorage.getItem('parentId') || '');
  const [childInfo, setChildInfo] = useState(null);
  const [results, setResults] = useState([]);
  const [teacherId, setTeacherId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  /**
   * ✅ Automatically prompt parent to link with child if needed.
   * ✅ Uses Firestore `setDoc` properly to store child link.
   */
  useEffect(() => {
    const fetchParentData = async () => {
      try {
        // ✅ 1) Check if parent is logged in
        const user = auth.currentUser;
        if (!user) {
          navigate('/parent-login');
          return;
        }

        const id = localStorage.getItem('parentId') || user.uid;
        setParentId(id);

        const parentRef = doc(db, 'parents', id);
        const parentSnap = await getDoc(parentRef);

        let childId;

        // ✅ 2) If no linked child, prompt to select & link
        if (!parentSnap.exists() || !parentSnap.data().childId) {
          const studentsSnap = await getDocs(collection(db, 'students'));
          const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const grades = [...new Set(students.map(s => s.grade))];

          const { value: grade } = await Swal.fire({
            title: 'Select Grade',
            input: 'select',
            inputOptions: grades.reduce((acc, g) => {
              acc[g] = g;
              return acc;
            }, {}),
            inputPlaceholder: 'Select grade',
            confirmButtonText: 'Next',
            inputValidator: (value) => !value && 'You must select a grade'
          });

          if (!grade) throw new Error('Grade not selected.');

          const filtered = students.filter(s => s.grade === grade);
          const options = filtered.reduce((acc, s) => {
            acc[s.id] = s.name;
            return acc;
          }, {});

          const { value: selectedChildId } = await Swal.fire({
            title: `Select Child in ${grade}`,
            input: 'select',
            inputOptions: options,
            inputPlaceholder: 'Select child',
            confirmButtonText: 'Link & Continue',
            inputValidator: (value) => !value && 'You must select a child'
          });

          if (!selectedChildId) throw new Error('Child not selected.');

          // ✅ Proper Firestore write using `setDoc`
          await setDoc(doc(db, 'parents', id), { childId: selectedChildId }, { merge: true });

          childId = selectedChildId;

        } else {
          childId = parentSnap.data().childId;
        }

        // ✅ 3) Load child info
        const childRef = doc(db, 'students', childId);
        const childSnap = await getDoc(childRef);
        if (!childSnap.exists()) throw new Error('Linked child not found.');

        const child = { id: childId, ...childSnap.data() };
        setChildInfo(child);

        // ✅ 4) Get linked teacherId
        const linkedTeacherId = child.teacherId;
        if (!linkedTeacherId) throw new Error('No teacher linked.');
        setTeacherId(linkedTeacherId);

        // ✅ 5) Load child results
        const resSnap = await getDocs(
          query(collection(db, 'examResults'), where('studentId', '==', childId))
        );
        setResults(resSnap.docs.map(doc => doc.data()));

        setLoading(false);

      } catch (err) {
        console.error('Parent dashboard error:', err);
        setErrorMsg(err.message || 'Something went wrong.');
        setLoading(false);
      }
    };

    fetchParentData();
  }, [navigate]);

  /**
   * ✅ Logout clears everything and redirects.
   */
  const handleLogout = async () => {
    const confirm = await Swal.fire({
      title: 'Logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout'
    });
    if (confirm.isConfirmed) {
      await signOut(auth);
      localStorage.clear();
      navigate('/');
    }
  };

  // ✅ Render states
  if (loading) return <p className="p-4">Loading dashboard...</p>;
  if (errorMsg) return <p className="p-4 text-red-500">{errorMsg}</p>;

  return (
    <>
      {childInfo?.id && teacherId && (
        <ParentChatBox
          parentId={parentId || 'guest-parent'}
          childId={childInfo.id}
          teacherId={teacherId}
        />
      )}

      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Parent Dashboard</h2>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {childInfo && (
          <div className="mb-6 p-4 bg-gray-100 rounded shadow">
            <h3 className="text-lg font-semibold">Student Info</h3>
            <p><strong>Name:</strong> {childInfo.name}</p>
            <p><strong>Grade:</strong> {childInfo.grade}</p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Subject Performance</h3>
          {results.length === 0 ? (
            <p>No results found.</p>
          ) : (
            <ul className="space-y-3">
              {results.map((res, index) => (
                <li key={index} className="bg-white p-4 shadow rounded">
                  <p><strong>Subject:</strong> {res.subject}</p>
                  <p><strong>Exam:</strong> {res.exam}</p>
                  <p><strong>Score:</strong> {res.percentage}%</p>
                  <p><strong>Date:</strong> {res.completedDate}</p>
                  {res.feedback && (
                    <p className="mt-2 text-sm text-yellow-800 bg-yellow-50 p-2 rounded">
                      💬 <strong>Teacher Feedback:</strong> {res.feedback}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
