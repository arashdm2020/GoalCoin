'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

export default function SubmitPage() {
  const [weekNo, setWeekNo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [watermarkCode, setWatermarkCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const token = localStorage.getItem('auth_token');

      // Create FormData and append file
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload file to backend
      const uploadRes = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || 'Upload failed');
      }

      const uploadData = await uploadRes.json();
      setFileUrl(uploadData.url);
      showToast('✅ File uploaded successfully!', 'success');
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast(error.message || 'Failed to upload file', 'error');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!weekNo) {
      showToast('Please enter the week number', 'warning');
      return;
    }

    if (!file && !fileUrl) {
      showToast('Please upload a file', 'warning');
      return;
    }

    if (!fileUrl) {
      showToast('Please wait for file upload to complete', 'warning');
      return;
    }

    const weekNumber = parseInt(weekNo);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 13) {
      showToast('Please enter a valid week number (1-13)', 'warning');
      return;
    }

    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (!fileUrl) {
        showToast('Please provide a file URL', 'warning');
        setLoading(false);
        return;
      }

      const response = await fetch(`${backendUrl}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_wallet: user.wallet || user.id,
          challenge_id: 'main-challenge', // Default challenge
          week_no: parseInt(weekNo),
          file_url: fileUrl,
          watermark_code: watermarkCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`✅ Submission created! Watermark: ${watermarkCode}. Your submission will be reviewed by 5 reviewers.`, 'success');
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to submit', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">Weekly Submission</h1>
              <p className="text-sm text-gray-400">Submit your weekly progress proof</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Week Number</label>
                <input
                  type="number"
                  value={weekNo}
                  onChange={(e) => setWeekNo(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter week number (1-13)"
                  min="1"
                  max="13"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Photo/Video <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    disabled={uploading}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
                    required={!fileUrl}
                  />
                  {uploading && (
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                        <span className="text-sm text-blue-300">Uploading...</span>
                      </div>
                    </div>
                  )}
                  {file && fileUrl && (
                    <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-green-300">Uploaded: {file.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Max file size: 100MB. Supported formats: JPG, PNG, GIF, MP4, MOV, AVI, WEBM
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-300 mb-2">Important Guidelines</p>
                    <ul className="text-sm text-yellow-200 space-y-1">
                      <li>• Your submission will be reviewed by 5 random reviewers</li>
                      <li>• 3 matching votes required for approval</li>
                      <li>• You can appeal within 24h if rejected</li>
                      <li>• Include the watermark code in your file</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || uploading || !fileUrl || !weekNo}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit for Review'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
