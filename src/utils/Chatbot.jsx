// utils/Chatbot.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import amic_hub from '../img/amic_hub.png';

export default function Chatbot({ forceOpen = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isExamPage = location.pathname === '/exam';

  const [showChat, setShowChat] = useState(forceOpen);
  const [showPopup, setShowPopup] = useState(!forceOpen);

  useEffect(() => {
    if (isExamPage) {
      setShowChat(false);
      setShowPopup(false);
      const webchatEl = document.getElementById('webchat');
      if (webchatEl) webchatEl.innerHTML = '';
      const root = document.getElementById('root');
      if (root) root.classList.remove('hide-everything-except-chat');
    }
  }, [isExamPage]);

  useEffect(() => {
    if (!showChat || isExamPage) return;

    const existingScript = document.getElementById('botpress-script');
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = 'botpress-script';
    script.src = 'https://cdn.botpress.cloud/webchat/v2.4/inject.js';
    script.async = true;
    script.onload = () => {
      window.botpress.init({
        botId: '8f1fd171-6783-4645-a335-f92c6b1aafb8',
        clientId: '2ddf09b2-2eac-4542-add4-9fdd64391d83',
        selector: '#webchat',
        conversationId: undefined, // let it create a fresh one
        botConversationDescription: 'Welcome to Amic Hub CAT Study Assistant!',
        configuration: {
          color: '#5eb1ef',
          variant: 'soft',
          themeMode: 'light',
          fontFamily: 'inter',
          radius: 1,
          botName: 'Eduplanet CAT Assistant',
          avatarUrl: 'https://botpress.com/favicon.ico',
          enableReset: true,
          enableTranscriptDownload: true,
          disableAnimations: false,
          stylesheet: '',
          layoutWidth: '420px',
          startBehavior: 'send-welcome-event', // 👈 this ensures bot starts chat      
        },
      });
    };
    document.body.appendChild(script);
  }, [showChat, isExamPage]);

  const handleStudy = () => {
    setShowPopup(false);
    setShowChat(true);
    const root = document.getElementById('root');
    if (root) {
      root.classList.add('hide-everything-except-chat');
    }
  };

  const handleExit = () => {
    setShowPopup(false);
    setShowChat(false);
    navigate('/exam');
  };

  const handleBackHome = () => {
    setShowChat(false);
    const root = document.getElementById('root');
    if (root) {
      root.classList.remove('hide-everything-except-chat');
    }
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  return (
    <>
      {/* Welcome Popup */}
      {showPopup && !isExamPage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '500px',
              textAlign: 'center',
              boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '1rem' }}>
              Welcome to Amic Hub Study Platform 
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#4a5568' }}>
              This Chatbox is limited to CAT students Grade 12 only.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                onClick={handleStudy}
                style={{
                  backgroundColor: '#38a169',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Study
              </button>
              <button
                onClick={handleExit}
                style={{
                  backgroundColor: '#e53e3e',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Container */}
      {showChat && !isExamPage && (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999,
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="mt-52">
            <img src={amic_hub} alt="Eduplanet Logo" className="h-14 w-auto rounded-md shadow-md" />
          </div>
          <p className="mt-5">Click the chatbox to start!</p>
          <div id="webchat" style={{ width: '90%', maxWidth: '420px', height: '520px' }} />
          <button
            onClick={handleBackHome}
            style={{
              marginTop: '1.5rem',
              backgroundColor: '#2b6cb0',
              color: 'white',
              padding: '0.6rem 1.25rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Back to Home
          </button>
        </div>
      )}
    </>
  );
}
