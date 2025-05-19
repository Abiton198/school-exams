import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedTeacherRoute = ({ children }) => {
  const teacherInfo = JSON.parse(localStorage.getItem('teacherInfo'));
  const loginTime = parseInt(localStorage.getItem('teacherLoginTime'), 10);
  const now = Date.now();
  const maxSessionTime = 60 * 60 * 1000; // ⏱ 1 hour in milliseconds

  if (!teacherInfo || !loginTime || now - loginTime > maxSessionTime) {
    // ⛔ Session expired or no login
    localStorage.removeItem('teacherInfo');
    localStorage.removeItem('teacherLoginTime');
    return <Navigate to="/teacher-login" replace />;
  }

  return children;
};

export default ProtectedTeacherRoute;
