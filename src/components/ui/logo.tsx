import React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main triangle/A shape */}
      <path 
        d="M20 80 L50 20 L80 80 L70 80 L60 60 L40 60 L30 80 Z" 
        fill="#000000"
      />
      
      {/* Purple bar - top */}
      <rect 
        x="55" 
        y="25" 
        width="35" 
        height="8" 
        rx="4" 
        fill="#9333EA"
      />
      
      {/* Yellow bar - second */}
      <rect 
        x="60" 
        y="38" 
        width="30" 
        height="8" 
        rx="4" 
        fill="#EAB308"
      />
      
      {/* Orange bar - third */}
      <rect 
        x="65" 
        y="51" 
        width="25" 
        height="8" 
        rx="4" 
        fill="#F97316"
      />
      
      {/* Purple bar - bottom */}
      <rect 
        x="70" 
        y="64" 
        width="20" 
        height="8" 
        rx="4" 
        fill="#A855F7"
      />
    </svg>
  )
}