import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../utils/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import Swal from 'sweetalert2';

export default function ParentLinkForm() {
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [gradeOptions, setGradeOptions] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [studentsInGrade, setStudentsInGrade] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch all grades dynamically from Firestore
  useEffect(() => {
    const fetchGrades = async () => {
      const snap = await getDocs(collection(db, 'students'));
      const students = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const grades = [...new Set(students.map(s => s.grade))];
      setGradeOptions(grades.sort());
    };
    fetchGrades();
  }, []);

  // ✅ When grade is selected, fetch students for that grade
  useEffect(() => {
    const fetchStudentsForGrade = async () => {
      if (!selectedGrade) {
        setStudentsInGrade([]);
        return;
      }
      const q = collection(db, 'students');
      const snap = await getDocs(q);
      const students = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(s => s.grade === selectedGrade);
      setStudentsInGrade(students);
    };
    fetchStudentsForGrade();
  }, [selectedGrade]);

  // ✅ Google Sign-In, link parent, and save in Firestore
  const handleLinkParent = async () => {
    if (!parentName || !selectedGrade || !selectedStudentId) {
      Swal.fire('⚠️', 'Please fill in all fields.', 'warning');
      return;
    }

    try {
      setLoading(true);

      // 👉 1️⃣ Google Sign-In
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save parent info
      const studentRef = doc(db, 'students', selectedStudentId);
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        throw new Error('Selected student not found in Firestore.');
      }

      const { teacherId } = studentSnap.data();
      if (!teacherId) {
        throw new Error('Selected student has no teacher assigned.');
      }

      // Save in `parents` collection (parent UID from Google)
      await setDoc(doc(db, 'parents', user.uid), {
        name: parentName,
        email: user.email,
        childId: selectedStudentId,
        teacherId: teacherId
      });

      localStorage.setItem('parentId', user.uid);
      navigate('/parent-dashboard');
    } catch (err) {
      console.error('❌ Error:', err);
      Swal.fire('❌ Error', err.message || 'Could not complete linking.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">🔗 Link Parent to Student</h2>

      <input
        type="text"
        placeholder="Parent Name"
        value={parentName}
        onChange={(e) => setParentName(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
      />

      <select
        value={selectedGrade}
        onChange={(e) => {
          setSelectedGrade(e.target.value);
          setSelectedStudentId('');
        }}
        className="w-full p-2 mb-3 border rounded"
      >
        <option value="">Select Grade</option>
        {gradeOptions.map(grade => (
          <option key={grade} value={grade}>{grade}</option>
        ))}
      </select>

      {studentsInGrade.length > 0 && (
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
        >
          <option value="">Select Student</option>
          {studentsInGrade.map(student => (
            <option key={student.id} value={student.id}>{student.name}</option>
          ))}
        </select>
      )}

      <button
        onClick={handleLinkParent}
        disabled={loading}
        className={`w-full ${loading ? 'bg-gray-400' : 'bg-green-600'} text-white p-2 rounded font-semibold`}
      >
        {loading ? 'Linking...' : 'Link & Sign in with Google'}
      </button>
    </div>
  );
}
