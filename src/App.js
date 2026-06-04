import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const App = () => {
  const [receivedData, setReceivedData] = useState(null);
  const iframeRef = useRef(null);
  const childTabRef = useRef(null);
  const [sendForm, setSendForm] = useState({ title: '', description: '', value: '' });
  const [sendStatus, setSendStatus] = useState('');

  const CHILD_ORIGIN = 'https://vivebharath.github.io/browserapi-child-app/';

  const openChildInNewTab = () => {
    if (childTabRef.current && !childTabRef.current.closed) {
      childTabRef.current.focus();
    } else {
      childTabRef.current = window.open(CHILD_ORIGIN, 'child-app');
    }
  };

  const handleSendInputChange = (e) => {
    const { name, value } = e.target;
    setSendForm((prev) => ({ ...prev, [name]: value }));
  };

  const sendDataToChild = (e) => {
    e.preventDefault();
    if (!childTabRef.current || childTabRef.current.closed) {
      setSendStatus('⚠️ Child window is not open. Click "Open Child in New Tab" first.');
      return;
    }
    const message = {
      type: 'PARENT_DATA',
      payload: sendForm,
      timestamp: new Date().toISOString()
    };
    childTabRef.current.postMessage(message, CHILD_ORIGIN);
    setSendStatus('✅ Data sent to child successfully!');
    setSendForm({ title: '', description: '', value: '' });
  };

  useEffect(() => {
    const handleMessage = (event) => {
      // Security: Validate origin
      if (event.origin !== CHILD_ORIGIN) {
        console.warn('Received message from untrusted origin:', event.origin);
        return;
      }

      const data = event.data;
      console.log('Parent received:', data);

      if (data.type === 'FORM_SUBMITTED') {
        setReceivedData(data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);


  return (
    <div className="app-container">
      <div className="header">
        <h1> Parent App</h1>
        <p>Receiving form data from child iframe</p>
      </div>

      <div className="tab-btn-row">
        <button className="open-tab-btn" onClick={openChildInNewTab}>
          🔗 Open Child in New Tab
        </button>
      </div>

      <div className="main-content">
        <div className="send-panel">
          <h2>Send Data to Child</h2>
          <form onSubmit={sendDataToChild}>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={sendForm.title}
                onChange={handleSendInputChange}
                placeholder="Enter title"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                name="description"
                value={sendForm.description}
                onChange={handleSendInputChange}
                placeholder="Enter description"
              />
            </div>
            <div className="form-group">
              <label>Value:</label>
              <input
                type="text"
                name="value"
                value={sendForm.value}
                onChange={handleSendInputChange}
                placeholder="Enter value"
              />
            </div>
            <button type="submit" className="submit-btn"> Send to Child</button>
            {sendStatus && <p className="status-msg">{sendStatus}</p>}
          </form>
        </div>

        <div className="data-panel">
          <h2>Data Received from Child</h2>
          {receivedData ? (
            <div className="data-display">
              <p><strong>Name:</strong> {receivedData.name}</p>
              <p><strong>Email:</strong> {receivedData.email}</p>
              <p><strong>Phone:</strong> {receivedData.phone}</p>
              <p><strong>Message:</strong> {receivedData.message || '(empty)'}</p>
            </div>
          ) : (
            <p className="placeholder">Waiting for form submission from child...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
