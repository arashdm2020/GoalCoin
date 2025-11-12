'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const basicAuth = btoa(`${username}:${password}`);
      const response = await fetch(`${getBackendUrl()}/api/admin/dashboard-stats`, { // Use a protected route to test auth
        headers: { 'Authorization': `Basic ${basicAuth}` },
      });

      if (response.ok) {
        localStorage.setItem('admin_auth_header', `Basic ${basicAuth}`);
        router.push('/admin/dashboard');
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Login failed:', response.status, response.statusText, errorData);
        setError(`Invalid credentials (status: ${response.status})`);
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="w-full p-2 bg-gray-800 rounded" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full p-2 bg-gray-800 rounded" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full py-2 bg-yellow-500 text-black rounded">Login</button>
        </form>
      </div>
    </div>
  );
}
