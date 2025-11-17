'use client';

interface LoadingSkeletonProps {
  type?: 'table' | 'card' | 'list' | 'text';
  rows?: number;
  className?: string;
}

export default function LoadingSkeleton({ 
  type = 'card', 
  rows = 3,
  className = '' 
}: LoadingSkeletonProps) {
  
  if (type === 'table') {
    return (
      <div className={`animate-pulse ${className}`}>
        {/* Table Header */}
        <div className="bg-gray-800 rounded-t-lg p-4 flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-700 rounded flex-1"></div>
          ))}
        </div>
        
        {/* Table Rows */}
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="bg-gray-900 border-t border-gray-800 p-4 flex gap-4">
            {[...Array(4)].map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-800 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-gray-800 h-12 w-12"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={`animate-pulse space-y-3 ${className}`}>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-800 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="h-3 bg-gray-800 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // text type
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-800 rounded w-full"></div>
      ))}
    </div>
  );
}
