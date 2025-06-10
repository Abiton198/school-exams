import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import PasswordPage from './components/PasswordPage';
import ExamPage from './components/ExamPage';
import ResultPage from './components/ResultPage';
import ExamRules from './utils/ExamRules';
import ProtectedRoute from './utils/ProtectedRoute';
import ReviewPage from './components/ReviewPage';
import AllResults from './components/AllResults';
import { TeacherDashboard } from './components';
import amic_hub from './img/amic_hub.png';
import Chatbot from './utils/Chatbot';
import { AdminPanel } from './components';
import { ExamManager } from './components';
import TeacherLoginPage from './components/TeacherLoginPage';
import ProtectedTeacherRoute from './utils/ProtectedTeacherRoute';
import StudentExamDashboard from './components/StudentExamDashboard';
import TeacherSignupPage from './utils/TeacherSignupPage';
import ParentDashboard from './components/ParentDashboard';
import ParentLinkForm from './components/ParentLinkForm';
import LandingPage from './components/LandingPage'; // ✅ New Landing Page
// import StudentWelcomePage from './utils/StudentWelcomePage';
import ParentLogin from './utils/ParentLogin';

function App() {
  const [studentInfo, setStudentInfo] = useState(null);
  const [results, setResults] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const addResult = (result) => {
    setResults([...results, result]);
  };

  // const [studentInfo] = useState({ name: "John Doe" });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ✅ Navbar */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center p-10 bg-gray-800 text-white shadow-md z-50">
        <Link to="/" className="flex items-center space-x-2">
          <img src={amic_hub} alt="Logo" className="h-10 w-10 rounded-full" />
          <span className="text-lg font-bold">Amic Learning Hub</span>

        </Link>
          
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white text-2xl">
            ☰
          </button>
        </div>
      </header>

      {/* ✅ Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white/90 text-gray-800 px-4 py-4 space-y-3 shadow-xl z-50 backdrop-blur-md">
          <Link to="/student-dashboard" onClick={() => setMenuOpen(false)} className="block hover:text-blue-500">Student</Link>
          <Link to="/teacher-dashboard" onClick={() => setMenuOpen(false)} className="block hover:text-blue-500">Teacher</Link>
          <Link to="/parent-dashboard" onClick={() => setMenuOpen(false)} className="block hover:text-blue-500">Parent</Link>
          <Link to="/admin" onClick={() => setMenuOpen(false)} className="block hover:text-blue-500">Admin</Link>
        </div>
      )}

      {/* ✅ Main Content */}
      <div className="pt-24">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/password" element={<PasswordPage setStudentInfo={setStudentInfo} />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route
            path="/exam"
            element={
              <ProtectedRoute studentInfo={studentInfo}>
                <ExamPage studentInfo={studentInfo} addResult={addResult} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute studentInfo={studentInfo}>
                <ResultPage results={results} />
              </ProtectedRoute>
            }
          />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/exam-manager" element={<ExamManager />} />
         
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute studentInfo={studentInfo}>
                <StudentExamDashboard studentInfo={studentInfo} />
              </ProtectedRoute>
            }
          />
{/* 
            <Route
              path="/student-welcome"
              element={
                <ProtectedRoute studentInfo={studentInfo}>
                  <StudentWelcomePage studentInfo={studentInfo} />
                </ProtectedRoute>
              }
            /> */}

          <Route path="/all-results" element={<AllResults />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/exam-rules" element={<ExamRules />} />
          <Route path="/teacher-login" element={<TeacherLoginPage />} />
          <Route path="/teacher-signup" element={<TeacherSignupPage />} />
          <Route path="/parent-dashboard" element={<ParentDashboard parentId="parent123" />} />
          <Route path="/parent-link" element={<ParentLinkForm />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/parent-login" element={<ParentLogin />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
