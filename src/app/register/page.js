'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim()) {
      setStatus('⚠️ Please enter a username first.');
      return;
    }

    setIsLoading(true);
    setStatus('');

    try {
      // Step 1: Get registration challenge from server
      console.log('[Register] Requesting challenge for', username);
      const res = await fetch('/api/register-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        throw new Error(`Server error (${res.status}): ${await res.text()}`);
      }

      const options = await res.json();
      console.log('[Register] Received challenge options', options);

      // Step 2: Pass challenge to authenticator
      const attResp = await startRegistration(options);
      console.log('[Register] Got attestation response', attResp);

      // Step 3: Verify attestation response with server
      const verifyRes = await fetch('/api/verify-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          attestationResponse: attResp,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error(`Verify error (${verifyRes.status}): ${await verifyRes.text()}`);
      }

      const verification = await verifyRes.json();
      console.log('[Register] Verification result', verification);

      setStatus(
        verification.verified
          ? '✅ Registered successfully!'
          : '❌ Registration failed'
      );
    } catch (err) {
      console.error('[Register] Error during registration', err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
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
        disabled={isLoading}
      />
      <br />
      <button
        onClick={handleRegister}
        style={{ padding: 8 }}
        disabled={isLoading}
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>
      <p>{status}</p>
    </div>
  );
}
  