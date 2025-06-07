// src/utils/TeacherChatPopup.jsx
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
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const [replyMap, setReplyMap] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔄 Fetch messages from 'messages' collection for this teacher
  useEffect(() => {
    if (!teacherId) return;

    // const q = query(
    //   collection(db, 'parentComments'),
    //   where('teacherId', '==', teacherId),
    //   where('sender', '==', 'parent'), // 🧾 Only get messages from parents
    //   orderBy('timestamp') // 🕒 Order by time
    // );

    const q = query(collection(db, 'parentComments'), orderBy('timestamp'));


    const unsub = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);
      const unread = allMsgs.filter(m => !m.read).length;
      setUnreadCount(unread);
    });

    return () => unsub();
  }, [teacherId]);

  // ✅ Send a reply and mark message as read
  const handleSend = async (msg) => {
    const replyText = replyMap[msg.id];
    if (!replyText) return;

    await updateDoc(doc(db, 'parentComments', msg.id), {
      response: replyText,
      read: true,
      respondedAt: serverTimestamp(),
    });

    setReplyMap((prev) => ({ ...prev, [msg.id]: '' }));
  };

  return (
    <>
      {/* 🔘 Floating Button */}
      <div
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer z-50 flex items-center"
        onClick={() => setOpen(!open)}
      >
        💬 Chat
        {unreadCount > 0 && (
          <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {/* 💬 Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 bg-white w-80 max-h-[60vh] shadow-xl border rounded-lg p-4 overflow-y-auto z-50">
          <h3 className="text-lg font-semibold mb-3">📨 Parent Messages</h3>

          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet.</p>
          ) : (
            messages.map((msg) => (
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
                        setReplyMap((prev) => ({ ...prev, [msg.id]: e.target.value }))
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
