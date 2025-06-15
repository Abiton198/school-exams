// ✅ ParentChatBox.jsx — improved unread counter & badge logic

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
  const [message, setMessage] = useState('');      // 📝 Parent's input
  const [chatMessages, setChatMessages] = useState([]); // 📬 All chat messages
  const [isOpen, setIsOpen] = useState(false);     // 💬 Panel toggle
  const [unreadCount, setUnreadCount] = useState(0); // 🔴 Badge

  // 🔄 Real-time messages + unread count
  useEffect(() => {
    if (!parentId || !childId || !teacherId) return;

    const chatQuery = query(
      collection(db, 'parentComments'),
      where('parentId', '==', parentId),
      where('childId', '==', childId),
      where('teacherId', '==', teacherId),
      orderBy('timestamp')
    );

    const unsubscribe = onSnapshot(chatQuery, async (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatMessages(messages);

      // ✅ Count teacher messages not read yet
      const unreadTeacherMsgs = snapshot.docs.filter(
        d => d.data().sender === 'teacher' && !d.data().read
      );
      setUnreadCount(unreadTeacherMsgs.length);

      // ✅ If open, mark them as read immediately
      if (isOpen && unreadTeacherMsgs.length > 0) {
        for (const m of unreadTeacherMsgs) {
          await updateDoc(doc(db, 'parentComments', m.id), { read: true });
        }
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [parentId, childId, teacherId, isOpen]);

  // ✅ Toggle panel: If opening, mark all unread as read immediately
  const toggleChat = async () => {
    if (!isOpen && unreadCount > 0) {
      // Mark all unread teacher messages as read
      const unreadTeacherMsgs = chatMessages.filter(
        m => m.sender === 'teacher' && !m.read
      );
      for (const m of unreadTeacherMsgs) {
        await updateDoc(doc(db, 'parentComments', m.id), { read: true });
      }
      setUnreadCount(0);
    }
    setIsOpen(prev => !prev);
  };

  // ✅ Parent sends a message
  const sendMessage = async () => {
    if (!message.trim()) return;

    await addDoc(collection(db, 'parentComments'), {
      parentId,
      childId,
      teacherId,
      comment: message.trim(),
      sender: 'parent',
      timestamp: serverTimestamp(),
      read: true,  // ✅ Parent messages are immediately marked as read
      response: '' // Teacher response field placeholder
    });

    setMessage('');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* 💬 Floating Button */}
      <button
        onClick={toggleChat}
        className="relative bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg"
      >
        💬 Chat
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 📬 Chat Panel */}
      {isOpen && (
        <div className="mt-2 w-80 h-96 bg-white border shadow-lg rounded-lg flex flex-col">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg font-semibold">
            Chat with Teacher
          </div>

          {/* 📨 Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div key={idx}>
                {/* 💬 Parent message */}
                <div className={`text-sm ${msg.sender === 'parent' ? 'text-right' : 'text-left'}`}>
                  <p
                    className={`inline-block px-3 py-2 rounded ${
                      msg.sender === 'parent'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {msg.comment || '[No message]'}
                  </p>
                </div>

                {/* ✅ Teacher's response, if any */}
                {msg.response && (
                  <div className="text-left mt-1">
                    <p className="inline-block bg-green-100 text-green-800 px-3 py-2 rounded text-sm">
                      👨‍🏫 {msg.response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 📝 Input */}
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
