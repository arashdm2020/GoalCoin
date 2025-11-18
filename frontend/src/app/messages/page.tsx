'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'received' | 'sent';
}

interface User {
  id: string;
  email?: string;
  handle?: string;
}

export default function MessagesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const router = useRouter();

  // Mock messages data
  const mockMessages: Message[] = [
    {
      id: '1',
      sender: 'System Administrator',
      senderEmail: 'admin@goalcoin.com',
      subject: 'Welcome to GoalCoin - Your Fitness Journey Starts Here!',
      content: `Dear ${user?.handle || 'User'},

Welcome to GoalCoin! We're thrilled to have you join our community of fitness enthusiasts who are committed to transforming their lives through our 90-Day Challenge.

Here's what you can expect:

🎯 **Your Fitness Journey**
- Track your daily workouts and progress
- Submit weekly proof of your achievements
- Earn XP points and climb the leaderboard
- Connect with like-minded individuals

💰 **Rewards & Incentives**
- Burn multipliers based on your tier
- GOAL token rewards for consistency
- Exclusive access to premium content
- Special prizes for top performers

🏆 **Getting Started**
1. Complete your profile setup
2. Choose your challenge tier
3. Connect your wallet for payments
4. Start logging your daily activities

If you have any questions or need assistance, don't hesitate to reach out to our support team. We're here to help you succeed!

Best regards,
The GoalCoin Team

P.S. Remember, consistency is key! Small daily actions lead to massive transformations.`,
      timestamp: '2024-11-13T10:30:00Z',
      read: false,
      type: 'received'
    },
    {
      id: '2',
      sender: 'System Administrator',
      senderEmail: 'admin@goalcoin.com',
      subject: 'Weekly Challenge Update - Keep Up the Great Work!',
      content: `Hello ${user?.handle || 'Champion'},

We hope you're crushing your fitness goals this week! Here's your weekly update:

📊 **Your Progress This Week**
- Workouts completed: 5/7
- Current streak: 12 days
- XP earned: 450 points
- Leaderboard position: #47

🔥 **Motivation Boost**
You're doing amazing! Remember, every workout counts, and every healthy choice brings you closer to your transformation goal. The community is cheering you on!

💡 **Tips for Success**
- Plan your workouts in advance
- Take progress photos weekly
- Stay hydrated and get enough sleep
- Don't forget to submit your weekly proof

🎁 **Special Announcement**
We're launching a new referral program next week! Invite friends and earn bonus GOAL tokens for each successful referral.

Keep pushing forward!

The GoalCoin Team`,
      timestamp: '2024-11-12T14:15:00Z',
      read: true,
      type: 'received'
    },
    {
      id: '3',
      sender: 'System Administrator',
      senderEmail: 'admin@goalcoin.com',
      subject: 'Important: Wallet Verification Required',
      content: `Dear ${user?.handle || 'User'},

We noticed that your wallet verification is pending. To ensure the security of your account and enable all platform features, please complete the wallet verification process.

🔐 **Why Wallet Verification Matters**
- Secure your GOAL token rewards
- Enable cryptocurrency payments
- Participate in DAO governance
- Access premium features

📝 **How to Verify**
1. Go to Profile Settings
2. Click "Connect Wallet"
3. Sign the verification message
4. Confirm the transaction

This process takes less than 2 minutes and significantly enhances your account security.

If you encounter any issues during verification, please contact our support team immediately.

Security Team
GoalCoin Platform`,
      timestamp: '2024-11-11T09:00:00Z',
      read: true,
      type: 'received'
    }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
        const response = await fetch(`${backendUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        const data = await response.json();
        setUser(data.user);
        setMessages(mockMessages);
        // Don't auto-select any message on mobile, let user choose
        // On desktop, first message can be selected
        if (window.innerWidth >= 1024) {
          setSelectedMessage(mockMessages[0]);
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]); // Remove 'user' dependency to prevent infinite loop

  const handleArchive = () => {
    if (selectedMessage) {
      // Remove message from list
      setMessages(messages.filter(m => m.id !== selectedMessage.id));
      setSelectedMessage(null);
      
      // Show toast
      setToastMessage('Message archived successfully');
      setShowToast(true);
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  };

  const markAsRead = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  };

  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      markAsRead(message.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold">Messages</h1>
                <p className="text-sm text-gray-400">Internal communication system</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {messages.filter(m => !m.read).length} unread
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Messages List - Left Side (4 columns on desktop, full width on mobile) */}
          <div className={`lg:col-span-4 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden ${selectedMessage ? 'hidden lg:block' : 'block'}`}>
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold text-white">Inbox</h2>
            </div>
            <div className="overflow-y-auto h-full">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMessageSelect(message);
                  }}
                  className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-900/30 border-l-4 border-l-blue-500' : ''
                  } ${!message.read ? 'bg-blue-900/10' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {message.sender.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{message.sender}</p>
                        <p className="text-xs text-gray-400 truncate">{message.senderEmail}</p>
                      </div>
                    </div>
                    {!message.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <h3 className={`text-sm mb-1 truncate ${!message.read ? 'font-semibold text-white' : 'text-gray-300'}`}>
                    {message.subject}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {message.content.substring(0, 60)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(message.timestamp).toLocaleDateString()} {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Message Content - Right Side (8 columns on desktop, full width on mobile) */}
          <div className={`lg:col-span-8 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden ${selectedMessage ? 'block' : 'hidden lg:block'}`}>
            {selectedMessage ? (
              <div className="h-full flex flex-col">
                {/* Message Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Back button for mobile */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessage(null);
                        }}
                        className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {selectedMessage.sender.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-white break-words pr-2">{selectedMessage.subject}</h2>
                        <div className="flex items-center space-x-2 mt-1 flex-wrap">
                          <p className="text-xs sm:text-sm text-gray-400 truncate">From: {selectedMessage.sender}</p>
                          <span className="text-gray-600 hidden sm:inline">•</span>
                          <p className="text-xs sm:text-sm text-gray-400 truncate">{selectedMessage.senderEmail}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(selectedMessage.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!selectedMessage.read && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          New
                        </span>
                      )}
                      <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="prose prose-invert max-w-none">
                    <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {selectedMessage.content}
                    </div>
                  </div>
                </div>

                {/* Message Actions */}
                <div className="p-6 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={handleArchive}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                      >
                        Archive
                      </button>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800/50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No Message Selected</h3>
                  <p className="text-gray-500">Choose a message from the list to read it</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
