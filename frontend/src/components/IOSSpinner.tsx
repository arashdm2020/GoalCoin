'use client';

interface IOSSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'yellow' | 'blue';
  className?: string;
}

export default function IOSSpinner({
  size = 'md',
  color = 'white',
  className = '',
}: IOSSpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const colorStyles = {
    white: 'border-white/30 border-t-white',
    yellow: 'border-yellow-500/30 border-t-yellow-500',
    blue: 'border-blue-500/30 border-t-blue-500',
  };

  return (
    <div
      className={`
        ios-spinner
        ${sizeStyles[size]}
        ${colorStyles[color]}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
