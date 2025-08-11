'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();


  const getUserLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => reject(err)
      );
    });

    const handleLogin = async (e) => {
      e.preventDefault();
      setStatus('');
      setError('');
    
      try {
        const location = await getUserLocation();
        console.log(location);
    
        const { ok, data } = await login('demo', '1234', location);
    
        if (ok) {
          setStatus(data.message || 'Login successful');
          router.push('/'); // Redirect on success
        } else {
          setError(data.message || 'Login failed');
        }
      } catch (err) {
        // This catch runs if location fails OR login throws an error
        setError(err.message || 'Location access denied or unavailable.');
      }
    };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Add your username/password fields if needed */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Login with Location
          </button>
        </form>

        {status && (
          <p className="mt-4 text-green-600 text-center font-medium">{status}</p>
        )}
        {error && (
          <p className="mt-4 text-red-500 text-center font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
