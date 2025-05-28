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

// ✅ Renamed to avoid conflict with Firestore's `query()` function
function useQueryParams() {
  return new URLSearchParams(useLocation().search);
}

export default function ParentDashboard() {
  const queryParams = useQueryParams();
  const parentId = queryParams.get('parentId'); // Get parentId from URL query

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

        // Get parent data from Firestore
        const parentRef = doc(db, 'parents', parentId);
        const parentSnap = await getDoc(parentRef);

        if (!parentSnap.exists()) {
          setErrorMsg('Parent record not found.');
          return;
        }

        const childId = parentSnap.data().childId;

        // Get child data from Firestore
        const childRef = doc(db, 'students', childId);
        const childSnap = await getDoc(childRef);

        if (childSnap.exists()) {
          setChildInfo(childSnap.data());
        }

        // Fetch all exam results for the child
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

      {/* Student Information Card */}
      {childInfo && (
        <div className="mb-6 p-4 bg-gray-100 rounded shadow">
          <h3 className="text-lg font-semibold">Student Info</h3>
          <p><strong>Name:</strong> {childInfo.name}</p>
          <p><strong>Grade:</strong> {childInfo.grade}</p>
        </div>
      )}

      {/* Exam Results */}
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
