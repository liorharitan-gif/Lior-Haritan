import React from 'react';

export const Logo = ({ size = 'large', className = '' }: { size?: 'large' | 'small', className?: string }) => {
  const isSmall = size === 'small';
  
  // Brand Colors
  const deepSage = "#4A6E5D"; 

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Icon Container */}
      <div className={`${isSmall ? 'w-8 h-8' : 'w-24 h-24'} relative flex items-center justify-center`}>
         <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              {/* Soft Drop Shadow Filter for 3D Depth */}
              <filter id="ribbonShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="3" result="offsetblur" />
                <feFlood floodColor="#2E3A36" floodOpacity="0.2" />
                <feComposite in2="offsetblur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              {/* Gradient for Deep Sage Parts (Spine/Top/Bottom) - Matte Finish */}
              <linearGradient id="sageGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#5F8572" /> 
                <stop offset="50%" stopColor="#4A6E5D" />
                <stop offset="100%" stopColor="#355042" />
              </linearGradient>

               {/* Gradient for Mint Parts - Glowing Finish */}
              <linearGradient id="mintGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B4E5D9" />
                <stop offset="50%" stopColor="#98D8C8" />
                <stop offset="100%" stopColor="#7FBFA9" />
              </linearGradient>
            </defs>

            {/* Main Group with Shadow applied */}
            <g filter="url(#ribbonShadow)">
              
              {/* 
                 The "Spine" of the E (Deep Sage Ribbon).
                 Drawn as a rounded bracket to look like the top and bottom folds connecting to a back spine.
              */}
              <path 
                d="M 72 20 L 40 20 Q 20 20 20 40 L 20 60 Q 20 80 40 80 L 72 80" 
                stroke="url(#sageGradient)" 
                strokeWidth="16" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 
                 The "Equals" Sign (Soft Mint Ribbon).
                 Positioned slightly tucked into the spine's curve to imply a fold.
              */}
              {/* Top Bar */}
              <path 
                d="M 32 42 H 72" 
                stroke="url(#mintGradient)" 
                strokeWidth="10" 
                strokeLinecap="round" 
              />
              
              {/* Bottom Bar */}
              <path 
                d="M 32 58 H 72" 
                stroke="url(#mintGradient)" 
                strokeWidth="10" 
                strokeLinecap="round" 
              />
            </g>
         </svg>
      </div>
      
      {/* Text Label (Hidden in small mode) */}
      {!isSmall && (
        <span className="mt-2 text-3xl font-normal tracking-tight" style={{ fontFamily: 'Heebo, sans-serif', color: deepSage }}>
          Evenly
        </span>
      )}
    </div>
  );
};