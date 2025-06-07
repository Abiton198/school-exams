// src/utils/ParentChatBox.jsx
import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  addDoc,
  orderBy,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function ParentChatBox({ parentId, childId, teacherId }) {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false); // ❗ Start closed so user must click
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔁 Fetch messages in real time
  useEffect(() => {
    if (!parentId || !childId || !teacherId) return;

    const chatQuery = query(
      collection(db, 'messages'),
      where('parentId', '==', parentId),
      where('childId', '==', childId),
      where('teacherId', '==', teacherId),
      orderBy('timestamp')
    );

    const unsubscribe = onSnapshot(chatQuery, async (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatMessages(messages);

      // 🧮 Count unread messages from teacher
      const unread = snapshot.docs.filter(
        doc => doc.data().sender === 'teacher' && !doc.data().read
      );
      setUnreadCount(unread.length);

      // ✅ Mark teacher messages as read if panel is open
      if (isOpen && unread.length > 0) {
        for (const docSnap of unread) {
          await updateDoc(doc(db, 'messages', docSnap.id), { read: true });
        }
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [parentId, childId, teacherId, isOpen]);

  // 🚀 Send parent message
  const sendMessage = async () => {
    if (!message.trim()) return;

    await addDoc(collection(db, 'messages'), {
      parentId,
      childId,
      teacherId,
      sender: 'parent',
      message,
      timestamp: serverTimestamp(),
      read: false,
    });

    setMessage('');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* 🔘 Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg"
      >
        💬 Chat
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 💬 Chat Panel */}
      {isOpen && (
        <div className="mt-2 w-80 h-96 bg-white border shadow-lg rounded-lg flex flex-col">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg font-semibold">
            Chat with Teacher
          </div>

          {/* 📨 Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`text-sm ${msg.sender === 'parent' ? 'text-right' : 'text-left'}`}
              >
                <p
                  className={`inline-block px-3 py-2 rounded ${
                    msg.sender === 'parent'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {msg.message}
                </p>
              </div>
            ))}
          </div>

          {/* ✏️ Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border px-3 py-2 rounded"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

