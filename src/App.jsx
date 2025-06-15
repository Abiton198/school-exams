import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ExamPage from './components/ExamPage';
import ResultPage from './components/ResultPage';
import ProtectedRoute from './utils/ProtectedRoute';
import ReviewPage from './components/ReviewPage';
import AllResults from './components/AllResults';
import { TeacherDashboard } from './components';
import amic_hub from './img/amic_hub.png';
import Chatbot from './utils/Chatbot';
import { AdminPanel } from './components';
import { ExamManager } from './components';
// import StudentExamDashboard from './components/StudentExamDashboard';
import ParentDashboard from './components/ParentDashboard';
import LandingPage from './components/LandingPage';

function App() {
  const [studentInfo, setStudentInfo] = useState(null);
  const [results, setResults] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const addResult = (result) => setResults([...results, result]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center p-10 bg-gray-800 text-white shadow-md z-50">
        <Link to="/" className="flex items-center space-x-2">
          <img src={amic_hub} alt="Logo" className="h-10 w-10 rounded-full" />
          <span className="text-lg font-bold">Amic Learning Hub</span>
        </Link>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-2xl">☰</button>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white/90 text-gray-800 px-4 py-4 space-y-3 shadow-xl z-50">
          <Link to="/exam" onClick={() => setMenuOpen(false)}>Student</Link>
          <Link to="/teacher-dashboard" onClick={() => setMenuOpen(false)}>Teacher</Link>
          <Link to="/parent-dashboard" onClick={() => setMenuOpen(false)}>Parent</Link>
          <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
        </div>
      )}

      {/* Routes */}
      <div className="pt-24">
        <Routes>
          <Route path="/" element={<LandingPage setStudentInfo={setStudentInfo} />} />
      
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
          <Route path="/all-results" element={<AllResults />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
