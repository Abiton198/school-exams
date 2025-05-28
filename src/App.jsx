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




function App() {
  const [studentInfo, setStudentInfo] = useState(null);
  const [results, setResults] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const addResult = (result) => {
    setResults([...results, result]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Section */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center p-4 bg-violet-400 text-white shadow-md z-50">
        <Link to="/" className="flex items-center space-x-2">
          <img src={amic_hub} alt="Eduplanet Logo" className="h-14 w-auto rounded-full shadow-md" />
          <span className="text-xl font-bold">Study & Exam Online</span>
        </Link>

        {/* Hamburger Menu (mobile only) */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white focus:outline-none text-3xl"
          >
            ☰
          </button>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/exam-rules" className="hover:text-gray-300 transition">Exam Rules</Link>
          <Link to="/student-dashboard" className="hover:text-gray-300 transition">Student</Link>
          <Link to="/admin" className="hover:text-gray-300 transition">Teacher</Link>
          <button
            onClick={() => setShowChat(true)}
            className="hover:text-yellow-200 transition"
          >
            Study
          </button>
        </nav>
      </header>

      {/* Mobile Menu (when open) */}
      {menuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white/90 text-blue-900 px-4 py-4 space-y-3 shadow-xl z-50 backdrop-blur-md">
          <Link to="/exam-rules" onClick={() => setMenuOpen(false)} className="block hover:text-blue-500">Exam Rules</Link>
          <Link to="/student-dashboard" onClick={() => setMenuOpen(false)} className="block hover:text-blue-500">Student</Link>
          <Link to="/admin" onClick={() => setMenuOpen(false)} className="block hover:text-blue-500">Teacher</Link>
          <button
            onClick={() => {
              setShowChat(true);
              setMenuOpen(false);
            }}
            className="block text-left w-full hover:text-blue-500"
          >
            Study
          </button>
        </div>
      )}

      {/* Chatbot Popup */}
      {showChat && <Chatbot forceOpen={true} onClose={() => setShowChat(false)} />}

      {/* Main Content Section */}
      <div className="pt-28">
        <Routes>
          <Route path="/" element={<PasswordPage setStudentInfo={setStudentInfo} />} />
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
          <Route
            path="/teacher-dashboard"
            element={
                <TeacherDashboard />
              // <ProtectedTeacherRoute>
              // </ProtectedTeacherRoute>
            }
          />
          <Route
            path="/exam-manager"
            element={
                <ExamManager />
              // <ProtectedTeacherRoute>
              // </ProtectedTeacherRoute>
            }
          />
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute studentInfo={studentInfo}>
                <StudentExamDashboard studentInfo={studentInfo} />
              </ProtectedRoute>
            }
          />
          <Route path="/all-results" element={<AllResults />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/exam-rules" element={<ExamRules />} />
          <Route path="/teacher-login" element={<TeacherLoginPage />} />
          <Route path="/teacher-signup" element={<TeacherSignupPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
