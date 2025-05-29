import React, { useEffect, useState } from 'react';
import { db } from '../utils/firebase';
import { useLocation } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// ✅ Extract query parameters like ?parentId=abc
function useQueryParams() {
  return new URLSearchParams(useLocation().search);
}

export default function ParentDashboard() {
  const queryParams = useQueryParams();
  const parentId = queryParams.get('parentId');

  const [childInfo, setChildInfo] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchParentAndChildData = async () => {
      try {
        if (!parentId) {
          setErrorMsg('No parent ID provided.');
          return;
        }

        // 🔍 Get parent document
        const parentRef = doc(db, 'parents', parentId);
        const parentSnap = await getDoc(parentRef);

        if (!parentSnap.exists()) {
          setErrorMsg('Parent record not found.');
          return;
        }

        const childId = parentSnap.data().childId;

        // 👶 Get student info
        const childRef = doc(db, 'students', childId);
        const childSnap = await getDoc(childRef);
        if (childSnap.exists()) {
          setChildInfo(childSnap.data());
        }

        // 📥 Get exam results for the student
        const resultsQuery = query(
          collection(db, 'examResults'),
          where('studentId', '==', childId)
        );
        const resultsSnap = await getDocs(resultsQuery);
        const fetchedResults = resultsSnap.docs.map(doc => doc.data());

        setResults(fetchedResults);
      } catch (err) {
        console.error(err);
        setErrorMsg('Something went wrong while loading the dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchParentAndChildData();
  }, [parentId]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (errorMsg) return <p className="p-4 text-red-500">{errorMsg}</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Parent Dashboard</h2>

      {/* 👤 Student Info Card */}
      {childInfo && (
        <div className="mb-6 p-4 bg-gray-100 rounded shadow">
          <h3 className="text-lg font-semibold">Student Info</h3>
          <p><strong>Name:</strong> {childInfo.name}</p>
          <p><strong>Grade:</strong> {childInfo.grade}</p>
        </div>
      )}

      {/* 📝 Exam Results + Feedback */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Subject Performance</h3>
        {results.length === 0 ? (
          <p>No results found for this student.</p>
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
  );
}
