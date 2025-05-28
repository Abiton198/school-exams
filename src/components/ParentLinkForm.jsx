import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { studentList } from '../data/studentData';

export default function ParentLinkForm() {
  // State for form inputs
  const [parentName, setParentName] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [grade, setGrade] = useState('');
  const [student, setStudent] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate(); // React Router navigation

  // Handle form submission
  const handleSubmit = async () => {
    // Ensure all fields are filled
    if (!parentName || !parentPassword || !grade || !student) {
      setMessage('Please fill in all fields.');
      return;
    }

    // Create unique studentId (same format used when students log in)
    const studentId = `Grade${grade}_${student.replace(/\s/g, '').toLowerCase()}`;
    const parentId = parentName.replace(/\s/g, '').toLowerCase(); // Unique parent ID

    try {
      // Save parent info in Firestore and link to childId
      await setDoc(doc(db, 'parents', parentId), {
        name: parentName,
        password: parentPassword,
        childId: studentId,
      });

      // Redirect parent to the dashboard with parentId in URL
      navigate(`/parent-dashboard?parentId=${parentId}`);
    } catch (error) {
      console.error('Error linking parent:', error);
      setMessage('Error occurred. Try again.');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Link Parent to Student</h2>

      {/* Parent name input */}
      <input
        type="text"
        placeholder="Parent Name"
        value={parentName}
        onChange={(e) => setParentName(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
      />

      {/* Parent password input */}
      <input
        type="password"
        placeholder="Parent Password"
        value={parentPassword}
        onChange={(e) => setParentPassword(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
      />

      {/* Grade selection dropdown */}
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

      {/* Student selection dropdown (appears after grade is selected) */}
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

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white p-2 rounded font-semibold"
      >
        Link Parent
      </button>

      {/* Feedback message */}
      {message && <p className="mt-3 text-center text-sm text-red-600">{message}</p>}
    </div>
  );
}
