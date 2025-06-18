import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { auth, db } from '../utils/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  addDoc
} from 'firebase/firestore';

export default function LandingPage({ setStudentInfo }) {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);

  // ✅ Load all schools
  useEffect(() => {
    const fetchSchools = async () => {
      const snap = await getDocs(collection(db, 'schools'));
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
      setSchools(list);
    };
    fetchSchools();
  }, []);

  // ✅ Auto-redirect if already signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const roles = ['students', 'teachers', 'parents', 'admins'];
        for (const role of roles) {
          if (localStorage.getItem(`${role}Id`)) {
            if (role === 'students') navigate('/exam');
            else if (role === 'teachers') navigate('/teacher-dashboard');
            else if (role === 'parents') navigate('/parent-dashboard');
            else navigate('/admin');
            break;
          }
        }
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleStudentClick = async () => {
    const { value: isNew } = await Swal.fire({
      title: 'Student Access',
      text: 'Are you a new student?',
      icon: 'question',
      showDenyButton: true,
      confirmButtonText: '✅ New Student',
      denyButtonText: '🔑 Existing Student',
      confirmButtonColor: '#22c55e',
      denyButtonColor: '#ef4444',
    });

    if (isNew) {
      // ✅ New student flow
      const { value: isNewSchool } = await Swal.fire({
        title: 'School',
        text: 'Is your school already listed?',
        icon: 'question',
        showDenyButton: true,
        confirmButtonText: 'Add New School',
        denyButtonText: 'Select Existing',
        confirmButtonColor: '#22c55e',
        denyButtonColor: '#3b82f6',
      });

      let schoolId = null;
      let schoolData = {};

      if (isNewSchool) {
        const { value: schoolName } = await Swal.fire({
          title: 'Enter School Name',
          input: 'text',
          inputPlaceholder: 'e.g. Sunshine High School',
          showCancelButton: true,
        });
        if (!schoolName) return;

        const province = 'Eastern Cape';
        const DISTRICTS = [
          'Amathole',
          'Buffalo City',
          'Chris Hani',
          'Joe Gqabi',
          'Nelson Mandela Bay',
          'OR Tambo',
          'Sarah Baartman'
        ];

        const { value: district } = await Swal.fire({
          title: 'Select District',
          input: 'select',
          inputOptions: DISTRICTS.reduce((acc, d) => {
            acc[d] = d;
            return acc;
          }, {}),
          inputPlaceholder: 'Choose district',
          showCancelButton: true,
        });
        if (!district) return;

        const docRef = await addDoc(collection(db, 'schools'), {
          name: schoolName,
          province,
          district,
          createdAt: new Date().toISOString(),
        });

        schoolId = docRef.id;
        schoolData = { name: schoolName, province, district };

        setSchools(prev => [...prev, { id: docRef.id, ...schoolData }]);

      } else {
        const { value: selectedId } = await Swal.fire({
          title: 'Select Your School',
          input: 'select',
          inputOptions: schools.reduce((acc, s) => {
            acc[s.id] = s.name;
            return acc;
          }, {}),
          inputPlaceholder: 'Choose school',
          showCancelButton: true,
        });
        if (!selectedId) return;

        const selected = schools.find(s => s.id === selectedId);
        schoolId = selected.id;
        schoolData = selected;
      }

      const { value: name } = await Swal.fire({
        title: 'Enter Full Name',
        input: 'text',
        inputPlaceholder: 'John Doe',
        showCancelButton: true,
      });
      if (!name) return;

      const exists = await getDocs(query(
        collection(db, `schools/${schoolId}/students`),
        where('name', '==', name)
      ));
      if (!exists.empty) {
        await Swal.fire('Already Registered', 'Name exists in this school.', 'info');
        return;
      }

      const { value: grade } = await Swal.fire({
        title: 'Select Grade',
        input: 'select',
        inputOptions: { '10': 'Grade 10', '11': 'Grade 11', '12': 'Grade 12' },
        inputPlaceholder: 'Choose grade',
        showCancelButton: true,
      });
      if (!grade) return;

      const { value: subjects } = await Swal.fire({
        title: 'Select Subjects',
        html: `
          <div style="text-align:left;">
            <label><input type="checkbox" value="Mathematics"> Mathematics</label><br/>
            <label><input type="checkbox" value="English"> English</label><br/>
            <label><input type="checkbox" value="CAT"> CAT</label><br/>
            <label><input type="checkbox" value="LO"> LO</label><br/>
            <label><input type="checkbox" value="History"> History</label><br/>
            <label><input type="checkbox" value="Geography"> Geography</label><br/>
            <label><input type="checkbox" value="Physics"> Physics</label><br/>
            <label><input type="checkbox" value="Business"> Business</label><br/>
            <label><input type="checkbox" value="Creative Arts"> Creative Arts</label><br/>
            <label><input type="checkbox" value="Xhosa"> Xhosa</label><br/>
            <label><input type="checkbox" value="Afrikaans"> Afrikaans</label>
          </div>
        `,
        preConfirm: () => {
          const selected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
          if (selected.length === 0) Swal.showValidationMessage('Select at least one subject.');
          return selected;
        },
        showCancelButton: true,
      });
      if (!subjects) return;

      handleStudentSignIn(name, false, grade, subjects, schoolId, schoolData);

    } else if (isNew === false) {
      // ✅ Existing student: ask name first
      const { value: name } = await Swal.fire({
        title: 'Enter Your Name',
        input: 'text',
        inputPlaceholder: 'John Doe',
        showCancelButton: true,
      });
      if (!name) return;

      let foundStudent = null;
      let foundSchoolId = null;

      for (const school of schools) {
        const snap = await getDocs(query(
          collection(db, `schools/${school.id}/students`),
          where('name', '==', name)
        ));
        if (!snap.empty) {
          foundStudent = snap.docs[0].data();
          foundSchoolId = school.id;
          break;
        }
      }

      if (!foundStudent) {
        return Swal.fire('Not Found', `No student named "${name}" found.`, 'info');
      }

      const html = `
        <div style="text-align:left; font-size:1.1em;">
          <p>👤 <strong>Name:</strong> ${foundStudent.name}</p>
          <p>🏫 <strong>School:</strong> ${foundStudent.schoolName || schools.find(s => s.id === foundSchoolId)?.name || 'N/A'}</p>
          <p>📍 <strong>District:</strong> ${foundStudent.district || schools.find(s => s.id === foundSchoolId)?.district || 'N/A'}</p>
          <p>🗺️ <strong>Province:</strong> ${foundStudent.province || schools.find(s => s.id === foundSchoolId)?.province || 'N/A'}</p>
          <p>🎓 <strong>Grade:</strong> ${foundStudent.grade}</p>
        </div>
      `;

      const confirm = await Swal.fire({
        title: `Is this you?`,
        html,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '✅ Yes, Sign In',
        cancelButtonText: '❌ Not Me',
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#ef4444',
      });

      if (confirm.isConfirmed) {
        const foundSchool = schools.find(s => s.id === foundSchoolId);
        handleStudentSignIn(name, true, null, null, foundSchoolId, {
          name: foundStudent.schoolName || foundSchool?.name,
          province: foundStudent.province || foundSchool?.province,
          district: foundStudent.district || foundSchool?.district
        });
      }
    }
  };

  const handleStudentSignIn = async (name, isExisting, grade, subjects, schoolId, schoolData) => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;
  
      const studentsRef = collection(db, `schools/${schoolId}/students`);
      const snap = await getDocs(query(studentsRef, where('name', '==', name)));
      let studentDoc = null;
      if (!snap.empty) studentDoc = snap.docs[0];
  
      if (isExisting && studentDoc) {
        const student = studentDoc.data();
        if (student.email && student.email !== user.email) {
          // ✅ MISMATCH → sign out immediately
          await auth.signOut();
          localStorage.clear();
          await Swal.fire(
            'Wrong Email',
            `This student is registered with:\n\n${student.email}\n\nPlease sign in with the correct email.`,
            'error'
          );
          return; // stop here
        }
        // ✅ All good → save & continue
        localStorage.setItem('studentsId', user.uid);
        localStorage.setItem('schoolId', schoolId);
        localStorage.setItem('studentInfo', JSON.stringify(student));
        if (setStudentInfo) setStudentInfo(student);
        navigate('/exam');
      } else if (!isExisting) {
        // ✅ Register new student with this Google email
        const studentRef = doc(studentsRef);
        const student = {
          name,
          grade: `Grade ${grade}`,
          subjects,
          email: user.email, // bind Google email
          schoolId,
          schoolName: schoolData.name,
          district: schoolData.district,
          province: schoolData.province,
          createdAt: new Date().toISOString(),
        };
        await setDoc(studentRef, student);
        localStorage.setItem('studentsId', user.uid);
        localStorage.setItem('schoolId', schoolId);
        localStorage.setItem('studentInfo', JSON.stringify(student));
        if (setStudentInfo) setStudentInfo(student);
        navigate('/exam');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Oops!', err.message, 'error');
    }
  };
  
  const cards = [
    { label: 'Student', gradient: 'from-blue-500 to-blue-700', onClick: handleStudentClick, icon: '🎓' },
    { label: 'Teacher', gradient: 'from-green-500 to-green-700', role: 'teachers', icon: '🧑‍🏫' },
    { label: 'Parent', gradient: 'from-yellow-400 to-yellow-600', role: 'parents', icon: '👨‍👩‍👧' },
    { label: 'Admin', gradient: 'from-red-500 to-red-700', role: 'admins', icon: '🛠️' },
  ];


  // ✅ 
const handleRoleClick = async (role) => {
  const { value: schoolId } = await Swal.fire({
    title: `Select School for ${role}`,
    input: 'select',
    inputOptions: schools.reduce((acc, s) => {
      acc[s.id] = s.name;
      return acc;
    }, {}),
    inputPlaceholder: 'Select school',
    showCancelButton: true,
  });
  if (!schoolId) return;

  const confirm = await Swal.fire({
    title: `${role.charAt(0).toUpperCase() + role.slice(1)} Sign In`,
    text: 'Sign in securely with Google.',
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Sign In',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#22c55e',
    cancelButtonColor: '#ef4444',
  });
  if (!confirm.isConfirmed) return;

  try {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const user = res.user;

    // ✅ Save under the school/role path
    const ref = doc(db, `schools/${schoolId}/${role}`, user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        name: user.displayName || '',
        email: user.email || '',
        schoolId,
        createdAt: new Date().toISOString(),
      });
    }

    localStorage.setItem(`${role}Id`, user.uid);
    localStorage.setItem('schoolId', schoolId);
    localStorage.setItem(`${role}Name`, user.displayName || '');

    // ✅ Route
    if (role === 'teachers') navigate('/teacher-dashboard');
    else if (role === 'parents') navigate('/parent-dashboard');
    else navigate('/admin');

  } catch (err) {
    console.error(err);
    Swal.fire('Oops!', err.message, 'error');
  }
};

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 rounded-full blur-3xl animate-pulse"></div>

      <div className="w-full max-w-6xl pt-24 px-4 text-center flex flex-col items-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white drop-shadow-md">
          🚀 Amic Learning Hub
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-xl">
          Secure Google Sign-In. Email verified. Revolutionalized & modernized education system for progressive learners.  
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {cards.map((card, i) => (
            <div
              key={i}
              onClick={() => card.role ? handleRoleClick(card.role) : card.onClick()}
              className={`cursor-pointer p-6 rounded-2xl text-center shadow-xl transform transition duration-500
                hover:scale-105 hover:shadow-2xl bg-gradient-to-br ${card.gradient} relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition"></div>
              <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center border-4 border-white text-4xl shadow-inner bg-white/10">
                {card.icon}
              </div>
              <p className="mt-5 text-2xl font-bold tracking-wide text-white drop-shadow">{card.label} </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
