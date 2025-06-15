// ✅ TeacherChatPopup.jsx — improved unread badge logic: shows ONLY unresponded + unread

import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export default function TeacherChatPopup({ teacherId, teacherName }) {
  const [messages, setMessages] = useState([]);   // 📨 All parent messages for this teacher
  const [open, setOpen] = useState(false);        // 🔘 Panel open/close
  const [replyMap, setReplyMap] = useState({});   // ✏️ Text input per message
  const [unreadCount, setUnreadCount] = useState(0); // 🔴 Badge for unread & unresponded

  // 🔁 Live listener: only for this teacher's parent messages
  useEffect(() => {
    if (!teacherId) return;

    const q = query(
      collection(db, 'parentComments'),
      where('teacherId', '==', teacherId),
      orderBy('timestamp')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);

      // 🟥 Count only messages from parent: not read + no response
      const unreadUnresponded = allMsgs.filter(
        m => m.sender === 'parent' && !m.read && !m.response
      );
      setUnreadCount(unreadUnresponded.length);
    });

    return () => unsub();
  }, [teacherId]);

  // ✅ Mark message as read and add teacher reply
  const handleSend = async (msg) => {
    const replyText = replyMap[msg.id];
    if (!replyText.trim()) return;

    await updateDoc(doc(db, 'parentComments', msg.id), {
      response: replyText.trim(),
      read: true,
      respondedAt: serverTimestamp(),
    });

    setReplyMap(prev => ({ ...prev, [msg.id]: '' }));
  };

  // ✅ When opening, mark all unresponded parent messages as read immediately
  const toggleChat = async () => {
    if (!open) {
      // Only mark parent messages that have not been read & not responded
      const toMarkRead = messages.filter(
        m => m.sender === 'parent' && !m.read && !m.response
      );
      for (const m of toMarkRead) {
        await updateDoc(doc(db, 'parentComments', m.id), { read: true });
      }
      setUnreadCount(0);
    }
    setOpen(prev => !prev);
  };

  return (
    <>
      {/* 🔘 Floating Button with badge */}
      <div
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer z-50 flex items-center"
      >
        💬 Chat
        {unreadCount > 0 && (
          <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {/* 📨 Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 bg-white w-80 max-h-[60vh] shadow-xl border rounded-lg p-4 overflow-y-auto z-50">
          <h3 className="text-lg font-semibold mb-3">📨 Parent Messages</h3>

          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet.</p>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="mb-4 border-b pb-2">
                <p><strong>👪 Parent:</strong> {msg.comment}</p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Child:</strong> {msg.childId || 'N/A'}
                </p>

                {msg.response ? (
                  <p className="text-green-700 mt-1">
                    <strong>✅ You replied:</strong> {msg.response}
                  </p>
                ) : (
                  <>
                    <textarea
                      value={replyMap[msg.id] || ''}
                      onChange={(e) =>
                        setReplyMap(prev => ({ ...prev, [msg.id]: e.target.value }))
                      }
                      className="w-full p-2 border mt-1 rounded text-sm"
                      rows={2}
                      placeholder="Type your reply..."
                    />
                    <button
                      onClick={() => handleSend(msg)}
                      className="bg-green-600 text-white px-3 py-1 text-sm mt-1 rounded hover:bg-green-700"
                    >
                      Reply
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
