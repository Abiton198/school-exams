import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import QRCode from 'qrcode.react';
import { nanoid } from 'nanoid'; // run: npm install nanoid
import Swal from 'sweetalert2';  // Ensure: npm install sweetalert2

const AdminQRCodeTool = () => {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('students');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // New: loading state

  const fetchUser = async () => {
    setUser(null);
    setError('');
    setLoading(true);
    try {
      const ref = doc(db, role, userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUser({ ...snap.data(), id: snap.id });
      } else {
        setError('User not found.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load user.');
    } finally {
      setLoading(false);
    }
  };

  const regenerateQRToken = async () => {
    const newToken = nanoid(20);
    setLoading(true);
    try {
      const userRef = doc(db, role, userId);
      await updateDoc(userRef, { qrToken: newToken });
      setUser((prev) => ({ ...prev, qrToken: newToken }));
      Swal.fire('QR Token Updated', 'A new QR code has been generated.', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to update token.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded mt-10">
      <h2 className="text-2xl font-bold mb-4">QR Code Generator</h2>

      <div className="flex gap-4 mb-4">
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

        <input
          type="text"
          placeholder="Enter user ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border p-2 flex-1 rounded"
        />

        <button
          onClick={fetchUser}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
        >
          {loading ? 'Loading...' : 'Load'}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {user && (
        <div className="text-center mt-6 border-t pt-4">
          <p className="font-semibold text-lg mb-2">{user.name || 'Unnamed User'}</p>

          {loading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            </div>
          ) : (
            <>
              <QRCode value={user.qrToken} size={200} />
              <p className="text-sm text-gray-600 mt-2 break-all">QR Token: {user.qrToken}</p>

              <button
                onClick={() => window.print()}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
              >
                🖨️ Print QR
              </button>

              <button
                onClick={regenerateQRToken}
                disabled={loading}
                className="mt-4 ml-2 bg-red-600 text-white px-4 py-2 rounded"
              >
                🔄 Regenerate QR Token
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminQRCodeTool;
