'use client';

import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setStatus('Starting login...');

    try {
      // 1️⃣ Request challenge from server
      const challengeRes = await fetch('/api/login-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!challengeRes.ok) {
        const err = await challengeRes.json();
        throw new Error(err.message || 'Failed to get challenge');
      }

      const options = await challengeRes.json();

      // 2️⃣ Get assertion from authenticator
      const authResponse = await startAuthentication(options);

      // 3️⃣ Send assertion back to server
      const verifyRes = await fetch('/api/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, assertionResponse: authResponse }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.verified) {
        setStatus('✅ Login successful!');
      } else {
        setStatus('❌ Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setStatus(`❌ ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">Login with Passkey</h1>

        <label className="block mb-2 font-medium">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full border rounded-lg p-2 mb-4 focus:ring focus:ring-blue-300"
          placeholder="Enter your username"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>

        {status && (
          <p className="mt-4 text-center text-sm text-gray-700">{status}</p>
        )}
      </form>
    </div>
  );
}
