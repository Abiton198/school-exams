// src/utils/CreateAdminRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AdminQRGenerator from '../utils/AdminQRGenerator';

export default function CreateAdminRoute() {
  const [loading, setLoading] = useState(true);
  const [adminExists, setAdminExists] = useState(false);

  useEffect(() => {
    const checkAdmins = async () => {
      const snapshot = await getDocs(collection(db, 'admins'));
      setAdminExists(!snapshot.empty);
      setLoading(false);
    };
    checkAdmins();
  }, []);

  if (loading) return <div className="p-10 text-center">Checking admin setup...</div>;

  // 🚫 Redirect to QR login if admin already exists
  return adminExists ? <Navigate to="/admin-qr-login" replace /> : <AdminQRGenerator />;
}
