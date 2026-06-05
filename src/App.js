import React, { useEffect, useState, useRef } from 'react';
import './App.css';

// 🌐 ENVIRONMENT SETUP: Automatically detect Local vs Production
const IS_LOCAL = window.location.hostname === 'localhost';
const CHILD_APP_URL = IS_LOCAL  ? 'http://localhost:3001/'  : 'https://vivebharath.github.io/browserapi-child-app/';
const EXPECTED_ORIGIN = IS_LOCAL ? 'http://localhost:3001'  : 'https://vivebharath.github.io';

const App = () => {
  const iframeRef = useRef(null);
  const childTabRef = useRef(null);
  const [sendForm, setSendForm] = useState({ whatHappened: '', whyIsItProblem: '', howDetected: '' });
  const [sendStatus, setSendStatus] = useState('');
  
  // 📱 Mobile Support State
  const [useIframe, setUseIframe] = useState(false);

  const openChildInNewTab = () => {
    setUseIframe(false); // Turn off iframe if opening a tab
    if (childTabRef.current && !childTabRef.current.closed) {
      childTabRef.current.focus();
    } else {
      childTabRef.current = window.open(CHILD_APP_URL, 'child-app');
    }
  };

  const handleSendInputChange = (e) => {
    const { name, value } = e.target;
    setSendForm((prev) => ({ ...prev, [name]: value }));
  };

  const sendDataToChild = (e) => {
    e.preventDefault();
    const message = {
      type: 'PARENT_DATA',
      payload: sendForm,
      timestamp: new Date().toISOString(),
    };
    console.log(window)

    // Check if we are using the Mobile Iframe OR the Desktop Tab
    if (useIframe && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(message, EXPECTED_ORIGIN);
      setSendStatus('✅ Data sent to mobile iframe successfully!');
    } else if (childTabRef.current && !childTabRef.current.closed) {
      childTabRef.current.postMessage(message, EXPECTED_ORIGIN);
      setSendStatus('✅ Data sent to child tab successfully!');
    } else {
      setSendStatus('⚠️ Child is not open. Click a button above first.');
      return;
    }

    // Reset Form
    // setSendForm({ whatHappened: '', whyIsItProblem: '', howDetected: '' });
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Check if the child tab was opened and is still active
      if (childTabRef.current && !childTabRef.current.closed) {
        // Cancel the event
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = ''; 
        // Return string for older browser support
        window.alert("TEST")
        return ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup the listener when the component unmounts
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== EXPECTED_ORIGIN) {
        console.warn('Received message from untrusted origin:', event.origin);
        return;
      }

      const data = event.data;
      console.log('Parent received:', data);

      if (data.type === 'FORM_SUBMITTED') {
        // setReceivedData(data.payload);
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
        {/* <button className="open-tab-btn" onClick={() => setUseIframe(!useIframe)}>
           {useIframe ? 'Close' : 'Open in'} Iframe (Mobile)
        </button> */}
      </div>

      {/* Mobile Iframe Container */}
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
          <h2>Send Data to Child</h2>
          <form onSubmit={sendDataToChild}>
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
            <button type="submit" className="submit-btn"> Send to Child</button>
            {sendStatus && <p className="status-msg">{sendStatus}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;