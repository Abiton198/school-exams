// ✅ src/components/QRLogin.jsx
import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../utils/firebase';
import { getDocs, query, collection, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const QRLogin = ({ setStudentInfo }) => {
  const [error, setError] = useState('');
  const [scanned, setScanned] = useState(false);
  const navigate = useNavigate();

  // ✅ Scanner mount/unmount
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scanner.render(
      handleScan,
      handleScanError
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  // ✅ Called on successful scan
  const handleScan = async (qrToken) => {
    if (!qrToken || scanned) return;

    console.clear();
    console.log('Scanned QR Token:', qrToken);

    const roles = ['students', 'teachers', 'parents', 'admins'];
    let foundUser = null;

    try {
      for (const role of roles) {
        console.log(`🔍 Checking ${role}...`);
        const q = query(collection(db, role), where('qrToken', '==', qrToken));
        const snap = await getDocs(q);

        console.log(`Docs in ${role}:`, snap.size);

        if (!snap.empty) {
          foundUser = {
            id: snap.docs[0].id,
            ...snap.docs[0].data(),
            role,
          };
          console.log(`✅ MATCH in ${role}:`, foundUser);
          break;
        }
      }

      if (foundUser) {
        localStorage.setItem('user', JSON.stringify(foundUser));

        if (foundUser.role === 'students' && setStudentInfo) {
          setStudentInfo(foundUser);
          setScanned(true);
          return navigate('/student-dashboard');
        }

        let dashboardRoute =
          foundUser.role.toLowerCase() === 'admin'
            ? '/admin'
            : `/${foundUser.role.replace(/s$/, '')}-dashboard`;

        setScanned(true);
        return navigate(dashboardRoute);
      }

      console.warn('❌ No match found.');
      setError('QR code not linked to any user.');
    } catch (err) {
      console.error('🔥 Firestore error:', err);
      setError('Failed to verify QR code.');
    }
  };

  // ✅ Called on scan errors
  const handleScanError = (err) => {
    console.warn('Scan error:', err);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-white">
      <h2 className="text-xl font-bold mb-4 text-center">Scan QR Code to Login</h2>

      {/* The scanner will mount here */}
      <div id="reader" className="w-full max-w-md" />

      {scanned && (
        <div className="text-center text-green-600 font-bold mt-4 text-xl animate-bounce">
          ✅ Logged In!
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default QRLogin;
