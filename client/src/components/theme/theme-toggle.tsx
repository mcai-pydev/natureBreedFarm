import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ size = 'md' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  const buttonSizes = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className={buttonSizes[size]}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className={`${iconSizes[size]} rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0`} />
      <Moon className={`${iconSizes[size]} absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}