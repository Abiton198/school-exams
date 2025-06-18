import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');

  // ✅ Eastern Cape districts & subjects
  const DISTRICTS = [
    'Amathole',
    'Buffalo City',
    'Chris Hani',
    'Joe Gqabi',
    'Nelson Mandela Bay',
    'OR Tambo',
    'Sarah Baartman'
  ];

  const SUBJECTS = [
    'Mathematics',
    'English',
    'CAT',
    'LO',
    'History',
    'Geography',
    'Physics',
    'Business',
    'Creative Arts',
    'Xhosa',
    'Afrikaans'
  ];

  const GRADES = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  // ✅ Prompt for admin name
  useEffect(() => {
    const savedAdmin = localStorage.getItem('adminName');

    if (savedAdmin) {
      setAdminName(savedAdmin);
    } else {
      Swal.fire({
        title: 'School Admin Login',
        text: 'Enter your name to access the panel',
        input: 'text',
        inputPlaceholder: 'e.g. Mr. Moyo',
        confirmButtonText: 'Login',
        allowOutsideClick: false,
        inputValidator: (value) => {
          if (!value) return 'Name is required';
        }
      }).then((res) => {
        if (res.value) {
          localStorage.setItem('adminName', res.value);
          setAdminName(res.value);
        }
      });
    }
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout'
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem('adminName');
        setAdminName('');
        window.location.reload();
      }
    });
  };

  const handleRegisterSchool = async () => {
    // ✅ Get school name
    const { value: schoolName } = await Swal.fire({
      title: 'Enter School Name',
      input: 'text',
      inputPlaceholder: 'e.g. Sunshine High School',
      showCancelButton: true
    });
    if (!schoolName) return;

    // ✅ Select District
    const { value: district } = await Swal.fire({
      title: 'Select District',
      input: 'select',
      inputOptions: DISTRICTS.reduce((acc, d) => {
        acc[d] = d;
        return acc;
      }, {}),
      inputPlaceholder: 'Choose district',
      showCancelButton: true
    });
    if (!district) return;

    // ✅ Select Grades
    const { value: selectedGrades } = await Swal.fire({
      title: 'Select Grades Offered',
      html: GRADES.map(g => `<label><input type="checkbox" value="${g}"> ${g}</label><br/>`).join(''),
      preConfirm: () => {
        const selected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        if (selected.length === 0) Swal.showValidationMessage('Select at least one grade.');
        return selected;
      },
      showCancelButton: true
    });
    if (!selectedGrades) return;

    // ✅ Select Subjects
    const { value: selectedSubjects } = await Swal.fire({
      title: 'Select Subjects Offered',
      html: SUBJECTS.map(s => `<label><input type="checkbox" value="${s}"> ${s}</label><br/>`).join(''),
      preConfirm: () => {
        const selected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        if (selected.length === 0) Swal.showValidationMessage('Select at least one subject.');
        return selected;
      },
      showCancelButton: true
    });
    if (!selectedSubjects) return;

    // ✅ Add teachers per subject
    const teachers = [];
    for (const subject of selectedSubjects) {
      const { value: teacherName } = await Swal.fire({
        title: `Teacher for ${subject}`,
        input: 'text',
        inputPlaceholder: 'e.g. Ms. Zulu',
        showCancelButton: true
      });
      if (!teacherName) continue;

      const { value: teacherEmail } = await Swal.fire({
        title: `Email for ${teacherName}`,
        input: 'email',
        inputPlaceholder: 'teacher@example.com',
        showCancelButton: true
      });
      if (!teacherEmail) continue;

      teachers.push({ name: teacherName, email: teacherEmail, subject });
    }

    // ✅ Save to Firestore
    await addDoc(collection(db, 'schools'), {
      name: schoolName,
      province: 'Eastern Cape',
      district,
      grades: selectedGrades,
      subjects: selectedSubjects,
      teachers,
      createdBy: adminName,
      createdAt: new Date().toISOString()
    });

    Swal.fire('Success', 'School & teachers registered!', 'success');
  };

  const sections = [
    {
      title: 'Register New School',
      description: 'Add a new school, its grades, subjects & teachers.',
      action: handleRegisterSchool,
      icon: '🏫',
      color: 'bg-blue-100'
    },
    {
      title: 'Teacher Dashboard',
      description: 'Add exams and manage questions.',
      path: '/teacher-dashboard',
      icon: '🧑‍🏫',
      color: 'bg-green-100'
    },
    {
      title: 'All Results',
      description: 'View and mark student exams.',
      path: '/all-results',
      icon: '📊',
      color: 'bg-yellow-100'
    },
    {
      title: 'Exam Manager',
      description: 'Edit or delete created exams.',
      path: '/exam-manager',
      icon: '🗂️',
      color: 'bg-purple-100'
    }
  ];

  if (!adminName) return <div className="pt-28 text-center text-gray-500">🔐 Authenticating admin...</div>;

  return (
    <div className="min-h-screen pt-28 px-4 bg-gray-50">
      <div className="flex justify-between items-center max-w-6xl mx-auto mb-8 px-2">
        <h1 className="text-2xl font-bold text-blue-700">👋 Welcome, {adminName}</h1>
        <button
          onClick={handleLogout}
          className="text-red-600 font-semibold hover:underline"
        >
          Logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {sections.map((section, i) => (
          <div
            key={i}
            onClick={() => section.action ? section.action() : navigate(section.path)}
            className={`cursor-pointer rounded-lg shadow-md p-6 transition transform hover:scale-105 ${section.color}`}
          >
            <div className="text-4xl mb-3 text-center">{section.icon}</div>
            <h3 className="text-lg font-semibold text-center text-gray-800">{section.title}</h3>
            <p className="text-sm text-gray-600 mt-2 text-center">{section.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
