// // ✅ src/utils/ProtectedRoute.jsx
// import React, { useEffect, useState } from 'react';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from './firebase';
// import { useNavigate } from 'react-router-dom';

// export default function ProtectedRoute({ children }) {
//   const [checking, setChecking] = useState(true);
//   const [authenticated, setAuthenticated] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setAuthenticated(true);
//       } else {
//         setAuthenticated(false);
//         navigate('/');
//       }
//       setChecking(false);
//     });

//     return () => unsubscribe();
//   }, [navigate]);

//   if (checking) {
//     return (
//       <div className="min-h-screen flex items-center justify-center text-gray-600">
//         🔐 Checking access...
//       </div>
//     );
//   }

//   return authenticated ? children : null;
// }

import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ studentInfo, children }) {
  if (!studentInfo) return <Navigate to="/" replace />;
  return children;
}
