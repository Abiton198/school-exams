import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../utils/firebase';

export default function ProtectedTeacherRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const localTeacher = localStorage.getItem('teacherInfo');
      const loggedIn = !!user || !!localTeacher;

      console.log("🔐 Auth state changed:", user ? user.uid : "No user", "| Manual:", !!localTeacher);
      setIsAuthenticated(loggedIn);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-center mt-20 text-gray-500 text-lg">Loading your dashboard...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/teacher-login" />;
}
