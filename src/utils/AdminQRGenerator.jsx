import React, { useState, useRef, useEffect } from 'react';
import { db } from '../utils/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';

const AdminQRGenerator = () => {
  const canvasRef = useRef();
  const [role, setRole] = useState('students');
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  // 🔄 Fetch users list when role changes
  useEffect(() => {
    fetchUsers();
    setUser(null);
    setUserId('');
  }, [role]);

  // 📁 Map role to correct Firestore collection (case-sensitive)
  const getCollectionName = (role) => {
    return role === 'admins' ? 'Admin' : role;
  };

  // 📥 Load users list from Firestore
  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, getCollectionName(role)));
      const userList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  // 🔍 Load selected user info
  const loadUser = async () => {
    setUser(null);
    setError('');
    if (!userId) return setError('Please select a user.');
    try {
      const ref = doc(db, getCollectionName(role), userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setUser({ ...data, id: snap.id });
        if (data.qrToken) generateQRCode(data.qrToken);
      } else {
        setError('User not found.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load user.');
    }
  };

  // 🧠 Generate and render QR code
  const generateQRCode = async (token) => {
    try {
      await QRCode.toCanvas(canvasRef.current, token, {
        width: 250, // increase size for better resolution
        color: {
          dark: '#000000',  // solid black dots
          light: '#FFFFFF'  // white background
        }
      });
    } catch (err) {
      console.error('❌ Failed to generate QR code', err);
    }
  };
  

  // 🔁 Regenerate QR token
  const regenerateQRToken = async () => {
    const newToken = nanoid(20);
    try {
      const ref = doc(db, getCollectionName(role), userId);
      await updateDoc(ref, { qrToken: newToken });
      setUser((prev) => ({ ...prev, qrToken: newToken }));
      generateQRCode(newToken);
      Swal.fire('QR Token Updated', 'A new QR code has been generated.', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to update QR token.', 'error');
    }
  };

  // ⬇️ Download the QR code as an image
  const downloadQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `${user.name || user.id}-qr.png`;
    link.click();
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded mt-10">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">QR Code Generator</h2>

      {/* Select Role and User */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="students">Student</option>
          <option value="teachers">Teacher</option>
          <option value="parents">Parent</option>
          <option value="admins">Admin</option>
        </select>

        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border p-2 rounded flex-1"
        >
          <option value="">-- Select User --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.id}
            </option>
          ))}
        </select>

        <button
          onClick={loadUser}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Load
        </button>
      </div>

      {/* Error display */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* QR Display Section */}
      {user && user.qrToken && (
        <div className="text-center mt-6 border-t pt-4">
          <p className="font-semibold text-lg mb-2">{user.name}</p>
          <canvas ref={canvasRef} className="mx-auto" />
          <p className="text-sm text-gray-600 mt-2">QR Token: {user.qrToken}</p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            <button
              onClick={downloadQRCode}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              📥 Download QR
            </button>
            <button
              onClick={regenerateQRToken}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              🔄 Regenerate Token
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-800 text-white px-4 py-2 rounded"
            >
              🖨️ Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQRGenerator;
