import React from 'react';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light' | 'dark';
  showText?: boolean;
  className?: string;
}

export function Logo({
  size = 'md',
  variant = 'default',
  showText = true,
  className
}: LogoProps) {
  // Calculate sizes based on the size prop
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  // Determine colors based on the variant
  const iconColors = {
    default: 'text-primary',
    light: 'text-white',
    dark: 'text-slate-800'
  };
  
  const textColors = {
    default: 'text-foreground',
    light: 'text-white',
    dark: 'text-slate-800'
  };
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('rounded-lg', iconColors[variant])}>
        <Leaf className={cn(iconSizes[size], 'rotate-45')} />
      </div>
      
      {showText && (
        <span className={cn('font-bold tracking-tight', textSizes[size], textColors[variant])}>
          Nature Breed
        </span>
      )}
    </div>
  );
}