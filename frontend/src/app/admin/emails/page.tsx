'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminEmailsPage() {
  const [authHeader, setAuthHeader] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Test Email Form
  const [testEmail, setTestEmail] = useState('');
  const [testTemplate, setTestTemplate] = useState<'verification' | 'password-reset' | 'weekly-digest' | 'admin-alert'>('verification');

  // Connection Status
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const storedAuth = localStorage.getItem('admin_auth_header');
    if (!storedAuth) {
      router.push('/admin');
      return;
    }
    setAuthHeader(storedAuth);
    checkConnection(storedAuth);
  }, []);

  const checkConnection = async (auth: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const response = await fetch(`${backendUrl}/api/email-test/connection`, {
        headers: { Authorization: auth },
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.success ? 'connected' : 'disconnected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      setConnectionStatus('disconnected');
    }
  };

  const sendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const response = await fetch(`${backendUrl}/api/email-test/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          email: testEmail,
          template: testTemplate,
        }),
      });

      if (response.ok) {
        setMessage(`✅ Test email sent successfully to ${testEmail}!`);
        setTestEmail('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send test email');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const queueTestEmail = async () => {
    if (!testEmail) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const response = await fetch(`${backendUrl}/api/email-test/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ email: testEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ Test emails queued! Job IDs: ${data.jobIds.join(', ')}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to queue emails');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-yellow-500">📧 Email Management</h1>
            <p className="text-sm text-gray-400 mt-1">Test and monitor email delivery</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            ← Back to Admin
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Connection Status */}
        <section className="mb-8">
          <div className={`rounded-lg p-6 border ${
            connectionStatus === 'connected' 
              ? 'bg-green-900/20 border-green-500/50' 
              : connectionStatus === 'disconnected'
              ? 'bg-red-900/20 border-red-500/50'
              : 'bg-gray-900 border-gray-800'
          }`}>
            <div className="flex items-center gap-4">
              <div className="text-3xl">
                {connectionStatus === 'checking' && '⏳'}
                {connectionStatus === 'connected' && '✅'}
                {connectionStatus === 'disconnected' && '❌'}
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {connectionStatus === 'checking' && 'Checking Mailgun connection...'}
                  {connectionStatus === 'connected' && 'Mailgun Connected'}
                  {connectionStatus === 'disconnected' && 'Mailgun Not Configured'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {connectionStatus === 'connected' && 'Email service is ready to send emails'}
                  {connectionStatus === 'disconnected' && 'Please configure MAILGUN_API_KEY and MAILGUN_DOMAIN in environment variables'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Send Test Email */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Send Test Email</h2>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <form onSubmit={sendTestEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Template</label>
                <select
                  value={testTemplate}
                  onChange={(e) => setTestTemplate(e.target.value as any)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-500"
                >
                  <option value="verification">Email Verification</option>
                  <option value="password-reset">Password Reset</option>
                  <option value="weekly-digest">Weekly Digest</option>
                  <option value="admin-alert">Admin Alert</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-3 text-green-400 text-sm">
                  {message}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || connectionStatus !== 'connected'}
                  className="flex-1 px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Now'}
                </button>

                <button
                  type="button"
                  onClick={queueTestEmail}
                  disabled={loading || connectionStatus !== 'connected'}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Queue Test Emails
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Email Templates Info */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Available Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="font-bold mb-2">✉️ Email Verification</h3>
              <p className="text-sm text-gray-400">Sent when user registers. Contains verification link.</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="font-bold mb-2">🔐 Password Reset</h3>
              <p className="text-sm text-gray-400">Sent when user requests password reset. Contains reset link.</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="font-bold mb-2">📊 Weekly Digest</h3>
              <p className="text-sm text-gray-400">Weekly summary of user's progress and stats.</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="font-bold mb-2">🚨 Admin Alert</h3>
              <p className="text-sm text-gray-400">Critical system alerts for administrators.</p>
            </div>
          </div>
        </section>

        {/* Setup Instructions */}
        <section className="mt-8">
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-6">
            <h3 className="font-bold mb-3 text-blue-400">📖 Mailgun Setup Instructions</h3>
            <ol className="space-y-2 text-sm text-gray-300">
              <li>1. Create account at <a href="https://mailgun.com" target="_blank" className="text-yellow-500 hover:underline">mailgun.com</a></li>
              <li>2. Verify your domain (or use sandbox for testing)</li>
              <li>3. Get your API key from Settings → API Keys</li>
              <li>4. Add to Render.com environment variables:
                <ul className="ml-6 mt-2 space-y-1 font-mono text-xs bg-gray-900 p-3 rounded">
                  <li>MAILGUN_API_KEY=your-key-here</li>
                  <li>MAILGUN_DOMAIN=your-domain.com</li>
                  <li>MAILGUN_REGION=eu</li>
                  <li>FROM_EMAIL=noreply@your-domain.com</li>
                </ul>
              </li>
              <li>5. Redeploy backend to apply changes</li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}
