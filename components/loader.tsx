import React from 'react';

const CustomLoader = () => {
  return (
    <div className="relative w-24 h-24 rotate-45">
      {[...Array(7)].map((_, index) => (
        <div
          key={index}
          className="absolute w-7 h-7 m-[2px]"
          style={{
            backgroundColor: '#addaf5',
            animation: `square-animation 10s ease-in-out infinite both`,
            animationDelay: `${-index * 1.4285714286}s`,
          }}
        />
      ))}
      <style>
        {`
          @keyframes square-animation {
            0%, 10.5% { left: 0; top: 0; }
            12.5%, 23% { left: 32px; top: 0; }
            25%, 35.5% { left: 64px; top: 0; }
            37.5%, 48% { left: 64px; top: 32px; }
            50%, 60.5% { left: 32px; top: 32px; }
            62.5%, 73% { left: 32px; top: 64px; }
            75%, 85.5% { left: 0; top: 64px; }
            87.5%, 98% { left: 0; top: 32px; }
            100% { left: 0; top: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default CustomLoader;
