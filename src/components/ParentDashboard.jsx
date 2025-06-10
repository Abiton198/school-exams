import React, { useEffect, useState } from 'react';
import { db, auth } from '../utils/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import ParentChatBox from '../utils/ParentChatBox';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [parentId, setParentId] = useState(localStorage.getItem('parentId') || '');
  const [childInfo, setChildInfo] = useState(null);
  const [results, setResults] = useState([]);
  const [teacherId, setTeacherId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 🔐 Resolve parentId from auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user || !user.email) {
        navigate('/parent-login');
        return;
      }

      try {
        const q = query(collection(db, 'parents'), where('email', '==', user.email));
        const snap = await getDocs(q);
        if (snap.empty) {
          setErrorMsg('Parent not found in Firestore.');
          setLoading(false);
          return;
        }

        const parentDoc = snap.docs[0];
        const fetchedParentId = parentDoc.id;
        setParentId(fetchedParentId);
        localStorage.setItem('parentId', fetchedParentId);
      } catch (err) {
        console.error('Error fetching parent:', err);
        setErrorMsg('Something went wrong.');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 📦 Load child and results
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!parentId) return;

      try {
        const parentRef = doc(db, 'parents', parentId);
        const parentSnap = await getDoc(parentRef);
        if (!parentSnap.exists()) {
          setErrorMsg('Parent record not found.');
          setLoading(false);
          return;
        }

        const { childId, teacherId } = parentSnap.data();

        if (!childId || !teacherId) {
          setErrorMsg('Missing child or teacher ID in parent record.');
          setLoading(false);
          return;
        }

        setTeacherId(teacherId);

        const childRef = doc(db, 'students', childId);
        const childSnap = await getDoc(childRef);
        if (!childSnap.exists()) {
          setErrorMsg('Student record not found.');
          setLoading(false);
          return;
        }

        setChildInfo({ id: childId, ...childSnap.data() });

        const resultsQuery = query(
          collection(db, 'examResults'),
          where('studentId', '==', childId)
        );
        const resultsSnap = await getDocs(resultsQuery);
        setResults(resultsSnap.docs.map(doc => doc.data()));
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setErrorMsg('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    if (parentId) {
      loadDashboardData();
    }
  }, [parentId]);

  // 🔓 Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('parentId');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ⏳ UI States
  if (loading) return <p className="p-4">Loading dashboard...</p>;
  if (errorMsg) return <p className="p-4 text-red-500">{errorMsg}</p>;

  return (
    <>
      {parentId && childInfo?.id && teacherId && (
        <ParentChatBox
          parentId={parentId}
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
