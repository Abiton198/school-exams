import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'react-qr-scanner';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function LandingPage() {
  const navigate = useNavigate();
  const [scanningRole, setScanningRole] = useState(null); // Current role being scanned
  const [scannedUser, setScannedUser] = useState(null);   // User data after successful scan
  const [error, setError] = useState('');                 // Error message
  const [scanned, setScanned] = useState(false);          // Flag for successful scan

  // Handle card click to start scanning for a specific role
  const handleCardClick = (role) => {
    setScanningRole(role);
    setError('');
    setScanned(false);
    setScannedUser(null);
  };

  // Handle QR scan result
  const handleScan = async (result) => {
    if (!result || !result.text || scanned || !scanningRole) return;

    const token = result.text;

    try {
      const q = query(collection(db, scanningRole), where('qrToken', '==', token));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const user = snapshot.docs[0].data();
        const userId = snapshot.docs[0].id;
        setScannedUser({ ...user, id: userId });
        setScanned(true);

        // Store session and redirect
        if (scanningRole === 'students') {
          localStorage.setItem('user', JSON.stringify({ ...user, role: 'students', id: userId }));
          setTimeout(() => navigate('/student-dashboard'), 1500);
        } else if (scanningRole === 'parents') {
          localStorage.setItem('parentName', user.name);
          localStorage.setItem('parentId', userId);
          setTimeout(() => navigate('/parent-dashboard'), 1500);
        } else if (scanningRole === 'teachers') {
          localStorage.setItem('teacherName', user.name);
          localStorage.setItem('teacherSubject', user.subject || '');
          setTimeout(() => navigate('/teacher-dashboard'), 1500);
        } else if (scanningRole === 'admins') {
          localStorage.setItem('adminName', user.name);
          setTimeout(() => navigate('/admin'), 1500);
        }
      } else {
        setError('QR code not linked to any user.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to process QR code.');
    }
  };

  // Handle scanner error
  const handleError = (err) => {
    console.error(err);
    setError('Camera error. Please try again or allow camera access.');
  };

  // Card data for different user roles
  const cards = [
    { label: 'Student', color: 'bg-blue-500', role: 'students', icon: '🎓' },
    { label: 'Teacher', color: 'bg-green-500', role: 'teachers', icon: '🧑‍🏫' },
    { label: 'Parent', color: 'bg-yellow-400', role: 'parents', icon: '👨‍👩‍👧' },
    { label: 'Admin', color: 'bg-red-500', role: 'admins', icon: '🛠️' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start pt-20 pb-48 px-4 relative">
      {/* Role selection cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(card.role)}
            className={`cursor-pointer p-6 rounded-xl text-center text-white shadow-xl transform transition duration-500 hover:scale-105 hover:shadow-2xl ${card.color}`}
          >
            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center border-4 border-white text-3xl">
              {card.icon}
            </div>
            <p className="mt-4 text-xl font-semibold">{card.label} QR Login</p>
          </div>
        ))}
      </div>

      {/* QR Scanner Modal */}
      {scanningRole && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg text-black max-w-md w-full relative">
            <h2 className="text-xl font-bold mb-3 text-center capitalize">
              Scan {scanningRole.slice(0, -1)} QR Code
            </h2>

            {!scanned ? (
              <QrScanner
                delay={300}
                onError={handleError}
                onScan={handleScan}
                style={{ width: '100%' }}
              />
            ) : (
              <div className="text-center mt-6">
                <div className="text-green-600 text-3xl font-bold animate-bounce mb-2">✅ Success!</div>
                <p className="text-lg">{scannedUser?.name}</p>
              </div>
            )}

            {error && <p className="text-red-600 mt-3 text-center">{error}</p>}

            <button
              onClick={() => {
                setScanningRole(null);
                setScanned(false);
                setError('');
                setScannedUser(null);
              }}
              className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
