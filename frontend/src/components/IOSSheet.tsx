'use client';

import { ReactNode, useEffect } from 'react';
import { lockScroll, unlockScroll, isIOS, hapticFeedback } from '@/utils/iosHelpers';

interface IOSSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showHandle?: boolean;
}

export default function IOSSheet({
  isOpen,
  onClose,
  children,
  title,
  showHandle = true,
}: IOSSheetProps) {
  useEffect(() => {
    if (isOpen) {
      lockScroll();
      if (isIOS()) {
        hapticFeedback('light');
      }
    } else {
      unlockScroll();
    }

    return () => {
      unlockScroll();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (isIOS()) {
      hapticFeedback('light');
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="ios-backdrop animate-fade-in"
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div className={`ios-sheet ${isOpen ? 'open' : ''}`}>
        {/* Handle */}
        {showHandle && <div className="ios-sheet-handle" />}

        {/* Title */}
        {title && (
          <div className="mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white text-center">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="ios-scroll-container">
          {children}
        </div>
      </div>
    </>
  );
}
