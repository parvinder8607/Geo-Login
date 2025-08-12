"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setMessage("");
    if (!username) {
      setMessage("Please enter a username");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Get registration options from backend
      const resp = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        setMessage("Error: " + err.message);
        setLoading(false);
        return;
      }

      const options = await resp.json();

      // Step 2: Use WebAuthn API to start registration
      const attestationResponse = await startRegistration(options);

      // Step 3: Send attestation response to backend for verification
      const verifyResp = await fetch("/api/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, attestationResponse }),
      });

      const verifyJSON = await verifyResp.json();

      if (verifyResp.ok && verifyJSON.verified) {
        setMessage("Registration successful! You can now log in.");
      } else {
        setMessage("Registration failed: " + (verifyJSON.message || "Unknown error"));
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Register with Fingerprint</h1>

        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-red-600 whitespace-pre-wrap">{message}</p>
        )}
      </div>
    </div>
  );
}
