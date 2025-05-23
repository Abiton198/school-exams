// src/utils/BackfillCreatedBy.jsx
import React, { useEffect, useState } from 'react';
import { getDocs, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export default function BackfillCreatedBy() {
  const [status, setStatus] = useState('Starting...');
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    const runBackfill = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'exams'));
        const actions = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const id = docSnap.id;

          if (!data.createdBy) {
            const name = localStorage.getItem('teacherName') || 'Unknown';
            await updateDoc(doc(db, 'exams', id), {
              createdBy: name,
            });
            actions.push(`✅ Added createdBy to "${data.title || 'Untitled'}"`);
          }
        }

        if (actions.length === 0) {
          setStatus('ℹ️ No exams needed updating.');
        } else {
          setStatus('✅ Backfill complete!');
          setUpdates(actions);
        }
      } catch (error) {
        console.error('❌ Error during backfill:', error);
        setStatus('❌ Backfill failed. See console for details.');
      }
    };

    runBackfill();
  }, []);

  return (
    <div className="pt-28 px-4 max-w-xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Backfilling Exams</h2>
      <p className="text-lg mb-4">{status}</p>
      <div className="text-left text-sm text-gray-700">
        {updates.map((msg, i) => (
          <p key={i}>• {msg}</p>
        ))}
      </div>
    </div>
  );
}
