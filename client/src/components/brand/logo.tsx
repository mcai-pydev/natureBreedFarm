import React from 'react';
import { Leaf } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white';
  showText?: boolean;
}

export function Logo({ 
  size = 'md', 
  variant = 'default',
  showText = false
}: LogoProps) {
  // Size mappings
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };
  
  // Color mappings
  const colorClass = variant === 'white' 
    ? 'text-white' 
    : 'text-primary';
  
  return (
    <div className="flex items-center gap-2">
      <div className={`${colorClass}`}>
        <Leaf className={sizeClasses[size]} />
      </div>
      
      {showText && (
        <span className={`font-bold ${variant === 'white' ? 'text-white' : ''}`}>
          Nature Breed
        </span>
      )}
    </div>
  );
}