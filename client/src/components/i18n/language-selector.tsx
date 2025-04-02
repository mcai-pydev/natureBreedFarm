import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'minimal' | 'full';
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

export function LanguageSelector({ 
  size = 'md',
  variant = 'minimal' 
}: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'yo', name: 'Yorùbá', flag: '🇳🇬' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  ];

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  const buttonSizes = {
    sm: variant === 'minimal' ? 'h-8 w-8' : 'h-8',
    md: variant === 'minimal' ? 'h-9 w-9' : 'h-9',
    lg: variant === 'minimal' ? 'h-10 w-10' : 'h-10'
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === i18n.language) || languages[0];
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={variant === 'minimal' ? 'icon' : 'sm'}
          className={cn(buttonSizes[size])}
        >
          {variant === 'minimal' ? (
            <Languages className={iconSizes[size]} />
          ) : (
            <div className="flex items-center gap-2">
              <Languages className={iconSizes[size]} />
              <span>{getCurrentLanguage().name}</span>
            </div>
          )}
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              lang.code === i18n.language && "bg-primary/10 text-primary"
            )}
            onClick={() => handleLanguageChange(lang.code)}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}