'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/useToastNotification';

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

// Settings Categories
const SETTINGS_CATEGORIES = [
  { id: 'general', name: 'General' },
  { id: 'system', name: 'System' },
  { id: 'security', name: 'Security' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'performance', name: 'Performance' },
  { id: 'maintenance', name: 'Maintenance' }
];

// Setting Component
const SettingItem = ({ setting, onUpdate }: { setting: any; onUpdate: (key: string, value: any) => void }) => {
  const renderInput = () => {
    switch (setting.type) {
      case 'boolean':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={setting.value}
              onChange={(e) => onUpdate(setting.key, e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        );
      case 'number':
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => onUpdate(setting.key, parseInt(e.target.value))}
            className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={setting.min || 0}
            max={setting.max || 1000}
          />
        );
      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => onUpdate(setting.key, e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {setting.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'text':
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => onUpdate(setting.key, e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={setting.placeholder}
          />
        );
      default:
        return <span className="text-gray-400">Unknown type</span>;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex-1">
        <h4 className="font-medium text-white">{setting.name}</h4>
        <p className="text-sm text-gray-400 mt-1">{setting.description}</p>
        {setting.warning && (
          <p className="text-xs text-yellow-400 mt-1">
            Warning: {setting.warning}
          </p>
        )}
      </div>
      <div className="ml-4">
        {renderInput()}
      </div>
    </div>
  );
};

// Status Card Component
const StatusCard = ({ title, status, details }: { title: string; status: string; details?: string }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'operational':
      case 'connected':
      case 'healthy':
        return 'text-green-400 bg-green-900/20 border-green-700';
      case 'warning':
      case 'degraded':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'error':
      case 'disconnected':
      case 'unhealthy':
        return 'text-red-400 bg-red-900/20 border-red-700';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm">{title}</h3>
          {details && <p className="text-xs opacity-75">{details}</p>}
        </div>
        <span className="font-bold text-xs uppercase tracking-wide">{status}</span>
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const { showSuccess, showError, ToastComponent } = useToast();
  const [activeCategory, setActiveCategory] = useState('general');
  const [settings, setSettings] = useState<Record<string, any[]>>({});
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [backupRecords, setBackupRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock settings data (in real app, fetch from API)
  const mockSettings = {
    general: [
      {
        key: 'site_name',
        name: 'Site Name',
        description: 'The name of your GoalCoin platform',
        type: 'text',
        value: 'GoalCoin',
        placeholder: 'Enter site name'
      },
      {
        key: 'platform_email',
        name: 'Platform Email',
        description: 'Main contact email for the platform',
        type: 'text',
        value: 'support@goalcoin.com',
        placeholder: 'support@example.com'
      },
      {
        key: 'contact_email',
        name: 'Contact Email',
        description: 'Public contact email displayed to users',
        type: 'text',
        value: 'contact@goalcoin.com',
        placeholder: 'contact@example.com'
      },
      {
        key: 'xp_per_workout',
        name: 'XP Per Workout',
        description: 'XP points earned per workout completion',
        type: 'number',
        value: 20,
        min: 1,
        max: 100
      },
      {
        key: 'xp_per_meal',
        name: 'XP Per Meal Log',
        description: 'XP points earned per meal logged',
        type: 'number',
        value: 10,
        min: 1,
        max: 100
      },
      {
        key: 'xp_per_warmup',
        name: 'XP Per Warmup',
        description: 'XP points earned per warmup completion',
        type: 'number',
        value: 5,
        min: 1,
        max: 50
      },
      {
        key: 'xp_per_submission',
        name: 'XP Per Submission',
        description: 'XP points earned per submission',
        type: 'number',
        value: 50,
        min: 1,
        max: 200
      },
      {
        key: 'xp_per_referral',
        name: 'XP Per Referral',
        description: 'XP points earned per successful referral',
        type: 'number',
        value: 100,
        min: 1,
        max: 500
      },
      {
        key: 'goal_points_per_submission',
        name: 'Goal Points Per Submission',
        description: 'Goal Points earned per approved submission',
        type: 'number',
        value: 100,
        min: 1,
        max: 1000
      },
      {
        key: 'burn_multiplier',
        name: 'Burn Multiplier',
        description: 'Token burn multiplier for rewards',
        type: 'number',
        value: 1.0,
        min: 0.1,
        max: 10.0,
        step: 0.1
      },
      {
        key: 'challenge_duration_weeks',
        name: 'Challenge Duration (Weeks)',
        description: 'Total weeks for the challenge',
        type: 'number',
        value: 13,
        min: 1,
        max: 52
      },
      {
        key: 'challenge_entry_fee',
        name: 'Challenge Entry Fee ($)',
        description: 'Entry fee for joining the challenge',
        type: 'number',
        value: 19,
        min: 0,
        max: 1000
      },
      {
        key: 'minimum_streak',
        name: 'Minimum Streak Required',
        description: 'Minimum consecutive days required',
        type: 'number',
        value: 7,
        min: 1,
        max: 30
      },
      {
        key: 'social_twitter',
        name: 'Twitter/X Link',
        description: 'Official Twitter/X profile URL',
        type: 'text',
        value: 'https://twitter.com/goalcoin',
        placeholder: 'https://twitter.com/...'
      },
      {
        key: 'social_discord',
        name: 'Discord Link',
        description: 'Official Discord server URL',
        type: 'text',
        value: 'https://discord.gg/goalcoin',
        placeholder: 'https://discord.gg/...'
      },
      {
        key: 'social_telegram',
        name: 'Telegram Link',
        description: 'Official Telegram group URL',
        type: 'text',
        value: 'https://t.me/goalcoin',
        placeholder: 'https://t.me/...'
      },
      {
        key: 'challenge_enrollment_open',
        name: 'Challenge Enrollment Open',
        description: 'Allow new users to enroll in the 90-day challenge',
        type: 'boolean',
        value: true
      },
      {
        key: 'challenge_price_display',
        name: 'Challenge Price (Display Only)',
        description: 'Price shown to users (visual only, not processed)',
        type: 'text',
        value: '$99',
        placeholder: '$99'
      },
      {
        key: 'maintenance_mode',
        name: 'Maintenance Mode',
        description: 'Enable maintenance mode to prevent user access',
        type: 'boolean',
        value: false,
        warning: 'This will block all user access to the platform'
      },
      {
        key: 'max_file_size',
        name: 'Max Upload Size (MB)',
        description: 'Maximum file size for submissions',
        type: 'number',
        value: 50,
        min: 1,
        max: 500
      },
      {
        key: 'default_language',
        name: 'Default Language',
        description: 'Default language for new users',
        type: 'select',
        value: 'en',
        options: [
          { value: 'en', label: 'English' },
          { value: 'fa', label: 'Persian' },
          { value: 'ar', label: 'Arabic' }
        ]
      }
    ],
    system: [
      {
        key: 'auto_backup',
        name: 'Auto Backup',
        description: 'Automatically backup database daily',
        type: 'boolean',
        value: true
      },
      {
        key: 'log_level',
        name: 'Log Level',
        description: 'System logging verbosity',
        type: 'select',
        value: 'info',
        options: [
          { value: 'error', label: 'Error Only' },
          { value: 'warn', label: 'Warnings' },
          { value: 'info', label: 'Info' },
          { value: 'debug', label: 'Debug' }
        ]
      },
      {
        key: 'session_timeout',
        name: 'Session Timeout (minutes)',
        description: 'Admin session timeout duration',
        type: 'number',
        value: 60,
        min: 5,
        max: 480
      }
    ],
    security: [
      {
        key: 'two_factor_required',
        name: 'Require 2FA',
        description: 'Force all admins to use two-factor authentication',
        type: 'boolean',
        value: false
      },
      {
        key: 'login_attempts',
        name: 'Max Login Attempts',
        description: 'Maximum failed login attempts before lockout',
        type: 'number',
        value: 5,
        min: 3,
        max: 10
      },
      {
        key: 'password_policy',
        name: 'Strong Password Policy',
        description: 'Enforce strong password requirements',
        type: 'boolean',
        value: true
      }
    ],
    notifications: [
      {
        key: 'email_notifications',
        name: 'Email Notifications',
        description: 'Send email notifications for important events',
        type: 'boolean',
        value: true
      },
      {
        key: 'notification_frequency',
        name: 'Notification Frequency',
        description: 'How often to send digest notifications',
        type: 'select',
        value: 'daily',
        options: [
          { value: 'realtime', label: 'Real-time' },
          { value: 'hourly', label: 'Hourly' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' }
        ]
      }
    ],
    performance: [
      {
        key: 'cache_enabled',
        name: 'Enable Caching',
        description: 'Use Redis caching for better performance',
        type: 'boolean',
        value: true
      },
      {
        key: 'rate_limit',
        name: 'API Rate Limit (per minute)',
        description: 'Maximum API requests per minute per user',
        type: 'number',
        value: 100,
        min: 10,
        max: 1000
      }
    ],
    maintenance: [
      {
        key: 'auto_cleanup',
        name: 'Auto Cleanup',
        description: 'Automatically clean old logs and temporary files',
        type: 'boolean',
        value: true
      },
      {
        key: 'cleanup_days',
        name: 'Cleanup After (days)',
        description: 'Delete logs older than this many days',
        type: 'number',
        value: 30,
        min: 7,
        max: 365
      }
    ]
  };

  const mockSystemStatus = {
    database: { status: 'operational', details: 'PostgreSQL' },
    redis: { status: 'operational', details: 'Cache' },
    mailgun: { status: 'operational', details: 'Email Service' },
    storage: { status: 'operational', details: '85% used' },
    api: { status: 'operational', details: '99.9% uptime' },
    blockchain: { status: 'operational', details: 'Ethereum' }
  };

  const mockBackupRecords = [
    { date: '2024-11-13', time: '02:00 AM', size: '2.4 GB', status: 'completed' },
    { date: '2024-11-12', time: '02:00 AM', size: '2.3 GB', status: 'completed' },
    { date: '2024-11-11', time: '02:00 AM', size: '2.2 GB', status: 'completed' },
    { date: '2024-11-10', time: '02:00 AM', size: '2.1 GB', status: 'completed' },
    { date: '2024-11-09', time: '02:00 AM', size: '2.0 GB', status: 'failed' }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setSettings(mockSettings);
      setSystemStatus(mockSystemStatus);
      setBackupRecords(mockBackupRecords);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSettingUpdate = async (key: string, value: any) => {
    try {
      // Update local state immediately for better UX
      setSettings(prev => ({
        ...prev,
        [activeCategory]: prev[activeCategory]?.map(setting => 
          setting.key === key ? { ...setting, value } : setting
        ) || []
      }));

      // In real app, make API call here
      console.log(`Updating ${key} to ${value}`);
      
      // Show success notification (you can add a toast library)
      // toast.success('Setting updated successfully');
    } catch (error) {
      console.error('Failed to update setting:', error);
      // Revert local state on error
      // toast.error('Failed to update setting');
    }
  };

  const handleBackup = async () => {
    try {
      // In real app, make API call to trigger backup
      console.log('Triggering backup...');
      showSuccess('Backup started successfully!');
    } catch (error) {
      console.error('Backup failed:', error);
      showError('Backup failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {ToastComponent}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-white text-glow mb-8">Settings</h1>

        {/* System Status - Horizontal */}
        <div className="mb-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">System Status</h2>
            <button
              onClick={handleBackup}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium text-sm"
            >
              Backup Now
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {systemStatus && Object.entries(systemStatus).map(([key, data]: [string, any]) => (
              <StatusCard
                key={key}
                title={key.charAt(0).toUpperCase() + key.slice(1)}
                status={data.status}
                details={data.details}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Categories</h2>
              <nav className="space-y-2">
                {SETTINGS_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span>{category.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Backup Records */}
            <div className="mt-8 bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Recent Backups</h2>
              <div className="space-y-2">
                {backupRecords.map((backup, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded text-sm">
                    <div>
                      <div className="font-medium">{backup.date}</div>
                      <div className="text-gray-400 text-xs">{backup.time} • {backup.size}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      backup.status === 'completed' 
                        ? 'bg-green-900/20 text-green-400' 
                        : 'bg-red-900/20 text-red-400'
                    }`}>
                      {backup.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900 rounded-lg border border-gray-800">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-semibold">
                  {SETTINGS_CATEGORIES.find(cat => cat.id === activeCategory)?.name} Settings
                </h2>
                <p className="text-gray-400 mt-1">
                  Configure {activeCategory} settings for your GoalCoin platform
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {settings[activeCategory]?.map((setting) => (
                    <SettingItem
                      key={setting.key}
                      setting={setting}
                      onUpdate={handleSettingUpdate}
                    />
                  ))}
                </div>

                {settings[activeCategory]?.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No settings available for this category.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
