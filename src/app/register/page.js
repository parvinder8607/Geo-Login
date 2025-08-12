'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');

  const handleRegister = async () => {
    try {
      const res = await fetch('/api/register-challenge', {
        method: 'POST',
        body: JSON.stringify({ username }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error: ${errText}`);
      }
      const options = await res.json();
      

      const attResp = await startRegistration(options);

      const verification = await fetch('/api/verify-register', {
        method: 'POST',
        body: JSON.stringify({ username, attestationResponse: attResp }),
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json());

      if (verification.verified) {
        setStatus('✅ Registered successfully!');
      } else {
        setStatus('❌ Registration failed');
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Register with Fingerprint</h1>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: 8, marginBottom: 8 }}
      />
      <br />
      <button onClick={handleRegister} style={{ padding: 8 }}>
        Register
      </button>
      <p>{status}</p>
    </div>
  );
}
