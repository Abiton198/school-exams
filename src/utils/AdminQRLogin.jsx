// src/components/AdminQRLogin.jsx
import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AdminQRLogin = () => {
  const [error, setError] = useState('');
  const [scanned, setScanned] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "admin-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(handleScan, handleScanError);

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const handleScan = async (token) => {
    if (!token || scanned) return;

    const cleanToken = token.trim();
    console.clear();
    console.log('📸 Scanned admin token:', cleanToken);

    try {
      const q = query(collection(db, 'Admin'), where('qrToken', '==', cleanToken));
      const snapshot = await getDocs(q);

      console.log(`Documents found: ${snapshot.size}`);

      snapshot.forEach(doc => {
        console.log(`Doc ID: ${doc.id}`, doc.data());
      });

      if (!snapshot.empty) {
        const admin = snapshot.docs[0].data();
        localStorage.setItem('adminName', admin.name || 'Admin');
        setScanned(true);
        navigate('/admin');
      } else {
        setError('QR code not recognized.');
      }
    } catch (err) {
      console.error('Firestore error:', err);
      setError('Login failed.');
    }
  };

  const handleScanError = (err) => {
    console.warn('Scan error:', err);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <h2 className="text-xl font-bold mb-4 text-center">Scan Admin QR Code</h2>

      {/* The html5-qrcode scanner renders here */}
      <div id="admin-reader" className="w-full max-w-md" />

      {scanned && (
        <div className="text-center animate-bounce text-green-500 text-4xl font-bold mt-4">
          ✅ Admin Logged In!
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default AdminQRLogin;
