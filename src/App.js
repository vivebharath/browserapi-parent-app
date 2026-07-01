import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import { initGA, logPageView, logEvent } from './analytics';

const IS_LOCAL = window.location.hostname === 'localhost';
const CHILD_APP_URL = IS_LOCAL  ? 'http://localhost:3001/'  : 'https://vivebharath.github.io/browserapi-child-app/';
const EXPECTED_ORIGIN = IS_LOCAL ? 'http://localhost:3001'  : 'https://vivebharath.github.io';

const App = () => {
  const iframeRef = useRef(null);
  const childTabRef = useRef(null);
  const [sendForm, setSendForm] = useState({ whatHappened: '', whyIsItProblem: '', howDetected: '' });
  const [useIframe, setUseIframe] = useState(false);
  
  // 🚨 NEW: Keep a live reference of the form data for our event listener
  const latestFormRef = useRef(sendForm);

  // Keep the ref constantly updated without triggering re-renders
  useEffect(() => {
    latestFormRef.current = sendForm;
  }, [sendForm]);

  const openChildInNewTab = () => {
    setUseIframe(false);
    if (childTabRef.current && !childTabRef.current.closed) {
      childTabRef.current.focus();
    } else {
      childTabRef.current = window.open(CHILD_APP_URL, 'child-app');
    }
  };
  // Place this inside your Parent App component
  useEffect(() => {
    initGA();
    logPageView();
    if (window.opener) {
      window.opener.postMessage({ 
        type: 'PARENT_READY', 
        timestamp: new Date().toISOString() 
      }, EXPECTED_ORIGIN);
    }
  }, []);

  const handleSendInputChange = (e) => {
    const { name, value } = e.target;
    setSendForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🚨 NEW: Real-Time Auto-Sync (Fires every time the user types)
  useEffect(() => {
    const message = {
      type: 'PARENT_DATA',
      payload: sendForm,
      timestamp: new Date().toISOString(),
    };

    if (useIframe && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, EXPECTED_ORIGIN);
    } else if (childTabRef.current && !childTabRef.current.closed) {
      childTabRef.current.postMessage(message, EXPECTED_ORIGIN);
    }
  }, [sendForm, useIframe]); // Depends on sendForm!

  // 🛡️ Prevent closing the parent if the child tab is open
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (childTabRef.current && !childTabRef.current.closed) {
        e.preventDefault();
        e.returnValue = ''; 
        return ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 👂 Message Listener
  useEffect(() => {
    const handleMessage = (event) => {
      console.log(event,"TEST")
      if (event.origin !== EXPECTED_ORIGIN) return;

      const data = event.data;

      // 🚨 NEW: When the Child says "I'm ready!", instantly send it the initial data
      if (data.type === 'CHILD_LOADED') {
        console.log('Parent recognized Child loaded. Sending initial data...');
        logEvent('Child', 'Loaded');
        // event.source refers to the exact window (tab or iframe) that sent the message
        event.source.postMessage({
          type: 'PARENT_DATA',
          payload: latestFormRef.current, // Use the ref to get the absolute latest state
          timestamp: new Date().toISOString()
        }, EXPECTED_ORIGIN);
      }

      if (data.type === 'FORM_SUBMITTED') {
        console.log('Parent received final data from Child:', data.payload);
        logEvent('Child', 'Form Submitted');
        setSendForm(data.payload); 
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); 

  return (
    <div className="app-container">
      <div className="header">
        <h1> Parent App (Consider Like VIM)</h1>
        <p>Running on: {IS_LOCAL ? 'Localhost' : 'Production'}</p>
      </div>

      <div className="tab-btn-row">
        <button className="open-tab-btn" onClick={openChildInNewTab}>
          🔗 Open in New Tab (Desktop)
        </button>
      </div>

      {useIframe && (
        <div className="iframe-container" style={{ marginTop: '20px', border: '2px solid #ccc' }}>
          <iframe 
            ref={iframeRef} 
            src={CHILD_APP_URL} 
            width="100%" 
            height="400px" 
            title="Child App"
          />
        </div>
      )}

      <div className="main-content">
        <div className="send-panel">
          <h2>Live Sync Data to Child</h2>
          {/* 🚨 REMOVED: <form> wrapper and the Submit Button */}
          <div className="form-group">
            <label>What happened?</label>
            <input
              type="text"
              name="whatHappened"
              value={sendForm.whatHappened}
              onChange={handleSendInputChange}
            />
          </div>
          <div className="form-group">
            <label>Why is it a Problem?</label>
            <input
              type="text"
              name="whyIsItProblem"
              value={sendForm.whyIsItProblem}
              onChange={handleSendInputChange}
            />
          </div>
          <div className="form-group">
            <label>How detected?</label>
            <input
              type="text"
              name="howDetected"
              value={sendForm.howDetected}
              onChange={handleSendInputChange}
            />
          </div>
          <p className="status-msg" style={{ color: 'gray', fontSize: '12px' }}>
            ℹ️ Changes here sync automatically to the AI Coach if it's open.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;