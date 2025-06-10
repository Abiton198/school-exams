import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../utils/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { studentList } from '../data/studentData';

export default function ParentLinkForm() {
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [grade, setGrade] = useState('');
  const [student, setStudent] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!parentName || !parentEmail || !parentPassword || !grade || !student) {
      setMessage('Please fill in all fields.');
      return;
    }

    const studentId = `Grade${grade}_${student.replace(/\s/g, '').toLowerCase()}`;

    try {
      // 🔍 Step 1: Fetch student from Firestore to get teacherId
      const studentRef = doc(db, 'students', studentId);
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        setMessage('Student not found in database.');
        return;
      }

      const studentData = studentSnap.data();
      const teacherId = studentData.teacherId;

      if (!teacherId) {
        setMessage('No teacher assigned to this student.');
        return;
      }

      // 🔐 Step 2: Register parent in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, parentEmail, parentPassword);
      const parent = userCredential.user;

      // 💾 Step 3: Save parent info in Firestore with teacherId
      await setDoc(doc(db, 'parents', parent.uid), {
        name: parentName,
        email: parentEmail,
        childId: studentId,
        teacherId: teacherId,
      });

      // 👉 Redirect to dashboard
      localStorage.setItem('parentId', parent.uid);
      navigate('/parent-dashboard');
    } catch (error) {
      console.error('❌ Error linking parent:', error);
      setMessage(error.message || 'Error occurred. Try again.');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Link Parent to Student</h2>

      <input
        type="text"
        placeholder="Parent Name"
        value={parentName}
        onChange={(e) => setParentName(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
      />

      <input
        type="email"
        placeholder="Parent Email"
        value={parentEmail}
        onChange={(e) => setParentEmail(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
      />

      <input
        type="password"
        placeholder="Create Password"
        value={parentPassword}
        onChange={(e) => setParentPassword(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
      />

      <select
        value={grade}
        onChange={(e) => {
          setGrade(e.target.value);
          setStudent('');
        }}
        className="w-full p-2 mb-3 border rounded"
      >
        <option value="">Select Grade</option>
        {Object.keys(studentList).map((g) => (
          <option key={g} value={g}>Grade {g}</option>
        ))}
      </select>

      {grade && studentList[grade] && (
        <select
          value={student}
          onChange={(e) => setStudent(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
        >
          <option value="">Select Student</option>
          {studentList[grade].map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
      )}

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white p-2 rounded font-semibold"
      >
        Link Parent & Register
      </button>

      {message && <p className="mt-3 text-center text-sm text-red-600">{message}</p>}
    </div>
  );
}
