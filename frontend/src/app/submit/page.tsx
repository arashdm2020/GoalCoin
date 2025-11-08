'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitPage() {
  const [weekNo, setWeekNo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [watermarkCode, setWatermarkCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    // Generate watermark code
    const code = `WEEK${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setWatermarkCode(code);
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file && !fileUrl) {
      alert('Please upload a file or provide a URL');
      return;
    }

    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // For MVP, we'll use a placeholder URL
      // In production, upload to S3/IPFS first
      const submissionFileUrl = fileUrl || `https://storage.goalcoin.com/${watermarkCode}-${file?.name}`;

      const response = await fetch(`${backendUrl}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          challenge_id: 'main-challenge', // Default challenge
          week_no: parseInt(weekNo),
          file_url: submissionFileUrl,
          watermark_code: watermarkCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Submission created! Watermark: ${watermarkCode}\n\nYour submission will be reviewed by 5 reviewers.`);
        router.push('/dashboard');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#FFD700]">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-[#FFD700] transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">📸 Weekly Submission</h1>
            <p className="text-gray-400 text-lg">
              Submit your weekly progress proof
            </p>
          </div>

          <div className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-8">
            {/* Watermark Display */}
            <div className="mb-8 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-200 mb-2">
                <strong>Your Watermark Code:</strong>
              </p>
              <p className="text-2xl font-mono font-bold text-[#FFD700]">
                {watermarkCode}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Include this code in your photo/video filename
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Week Number</label>
                <input
                  type="number"
                  value={weekNo}
                  onChange={(e) => setWeekNo(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="1"
                  min="1"
                  max="13"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Photo/Video
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                />
                {file && (
                  <p className="text-sm text-gray-400 mt-2">
                    Selected: {file.name}
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">Or</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  File URL (if already uploaded)
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="https://..."
                />
              </div>

              <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-sm text-yellow-200">
                  ⚠️ <strong>Important:</strong>
                </p>
                <ul className="text-xs text-yellow-100 mt-2 space-y-1">
                  <li>• Your submission will be reviewed by 5 random reviewers</li>
                  <li>• 3 matching votes required for approval</li>
                  <li>• You can appeal within 24h if rejected</li>
                  <li>• Include the watermark code in your file</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit for Review'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
