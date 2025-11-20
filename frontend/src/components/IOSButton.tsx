'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { isIOS, hapticFeedback } from '@/utils/iosHelpers';

interface IOSButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  haptic?: 'light' | 'medium' | 'heavy';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function IOSButton({
  children,
  haptic = 'medium',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  className = '',
  disabled = false,
  ...props
}: IOSButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // Trigger haptic feedback on iOS
    if (isIOS()) {
      hapticFeedback(haptic);
    }
    
    // Add visual feedback animation
    e.currentTarget.classList.add('ios-haptic-feedback');
    setTimeout(() => {
      e.currentTarget.classList.remove('ios-haptic-feedback');
    }, 100);
    
    // Call original onClick
    if (onClick) {
      onClick(e);
    }
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:opacity-90',
    secondary: 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-white hover:bg-white/10',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        font-bold rounded-lg transition-all shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
