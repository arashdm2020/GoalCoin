'use client';

const Loader = ({ size = 40 }: { size?: number }) => (
  <div className="flex justify-center items-center">
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      className="animate-spin"
    >
      <defs>
        <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path 
        d="M 100,20 A 80,80 0 1,1 20,100" 
        fill="none" 
        stroke="url(#gold-gradient)" 
        strokeWidth="20"
        strokeLinecap="round"
      />
      <path 
        d="M 100,60 L 100,100 L 140,100" 
        fill="none" 
        stroke="url(#gold-gradient)" 
        strokeWidth="20"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export default Loader;
