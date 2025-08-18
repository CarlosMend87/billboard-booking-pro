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
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main A/triangle shape - more compact */}
      <path 
        d="M25 100 L60 30 L95 100 L82 100 L72 75 L48 75 L38 100 Z" 
        fill="#000000"
      />
      
      {/* Purple bar - top, more compact */}
      <rect 
        x="62" 
        y="35" 
        width="48" 
        height="6" 
        rx="3" 
        fill="#8B5CF6"
      />
      
      {/* Yellow bar - second */}
      <rect 
        x="68" 
        y="48" 
        width="42" 
        height="6" 
        rx="3" 
        fill="#F59E0B"
      />
      
      {/* Orange bar - third */}
      <rect 
        x="74" 
        y="61" 
        width="36" 
        height="6" 
        rx="3" 
        fill="#F97316"
      />
      
      {/* Purple bar - bottom */}
      <rect 
        x="80" 
        y="74" 
        width="30" 
        height="6" 
        rx="3" 
        fill="#A855F7"
      />
    </svg>
  )
}