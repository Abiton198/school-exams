// src/pages/StudentWelcomePage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentWelcomePage({ studentInfo }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/student-dashboard");
    }, 3000); // redirect after 3 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-violet-900 to-indigo-900 text-white">
      <div className="text-center animate-pulse">
        <h1 className="text-4xl font-bold mb-4">🎓 Welcome, {studentInfo?.name || "Student"}!</h1>
        <p className="text-lg">Loading your dashboard...</p>
      </div>
    </div>
  );
}

// ! student welcome must navigate to login page first or should have a login page to student dashboard