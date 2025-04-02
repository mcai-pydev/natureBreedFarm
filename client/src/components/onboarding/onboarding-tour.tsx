import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  ShoppingCart, 
  Users, 
  LineChart, 
  ChevronRight, 
  ChevronLeft,
  Check,
  X,
  Sprout
} from 'lucide-react';

// For future internationalization
// Placeholder for when i18n is implemented
// This simplifies future translation integration
const t = (key: string, defaultValue: string) => defaultValue;

// Farm mascot character that will guide users
const FarmMascot = ({ animate = false }: { animate?: boolean }) => (
  <motion.div 
    className="relative w-24 h-24 mx-auto mb-4"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.2, duration: 0.5 }}
  >
    <motion.div 
      className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center"
      animate={animate ? {
        y: [0, -5, 0],
        scale: [1, 1.05, 1],
      } : undefined}
      transition={animate ? {
        duration: 0.8,
        ease: "easeInOut",
        times: [0, 0.5, 1],
        repeat: 0,
      } : undefined}
    >
      <Sprout className="h-12 w-12 text-green-600" />
      
      {/* Blinking eyes */}
      <motion.div 
        className="absolute top-6 left-7 bg-white rounded-full w-2 h-2"
        animate={{ scale: animate ? [1, 0.1, 1] : 1 }}
        transition={{ repeat: animate ? Infinity : 0, repeatDelay: 3, duration: 0.15 }}
      />
      <motion.div 
        className="absolute top-6 right-7 bg-white rounded-full w-2 h-2"
        animate={{ scale: animate ? [1, 0.1, 1] : 1 }}
        transition={{ repeat: animate ? Infinity : 0, repeatDelay: 3, duration: 0.15, delay: 0.1 }}
      />
      
      {/* Smiling mouth */}
      <motion.div 
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white h-1 rounded-lg"
        animate={{ width: animate ? [8, 12, 8] : 8 }}
        transition={{ repeat: animate ? Infinity : 0, repeatDelay: 3, duration: 0.8, delay: 0.2 }}
      />
    </motion.div>
    
    <motion.div 
      className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold shadow-md"
      initial={{ scale: 0 }}
      animate={{ scale: 1, rotate: animate ? [0, 10, -10, 0] : 0 }}
      transition={animate ? 
        { delay: 0.8, type: 'spring', duration: 0.5, repeat: Infinity, repeatDelay: 4 } : 
        { delay: 0.8, type: 'spring' }
      }
    >
      <span>!</span>
    </motion.div>
  </motion.div>
);

// Tour content for each step - prepared for future localization
const tourSteps = [
  {
    title: t('onboarding.welcome.title', 'Welcome to Nature Breed Farm!'),
    description: t('onboarding.welcome.description', 'A platform designed especially for farmers like you to manage your farm with ease.'),
    icon: <Home className="h-12 w-12 text-green-600" />,
    mascotSpeech: t('onboarding.welcome.mascotSpeech', 'Hi there! I\'m Sprout, your farm guide. Let me show you around!'),
    animation: "fadeIn"
  },
  {
    title: t('onboarding.shop.title', 'Shop Farm Products'),
    description: t('onboarding.shop.description', 'Browse through goats, fish, ducks, chickens, rabbits, snails, and vegetables.'),
    icon: <ShoppingCart className="h-12 w-12 text-blue-600" />,
    mascotSpeech: t('onboarding.shop.mascotSpeech', 'Our shop makes it easy to find what you need for your farm!'),
    animation: "slideRight"
  },
  {
    title: t('onboarding.breeding.title', 'Animal Breeding'),
    description: t('onboarding.breeding.description', 'Keep track of your animals\' family trees and get breeding suggestions.'),
    icon: <Users className="h-12 w-12 text-purple-600" />,
    mascotSpeech: t('onboarding.breeding.mascotSpeech', 'Never lose track of your animal lineage again!'),
    animation: "bounce"
  },
  {
    title: t('onboarding.progress.title', 'Track Your Farm Progress'),
    description: t('onboarding.progress.description', 'View reports and statistics to see how your farm is doing.'),
    icon: <LineChart className="h-12 w-12 text-orange-600" />,
    mascotSpeech: t('onboarding.progress.mascotSpeech', 'Data to help your farm grow better every season!'),
    animation: "pulse"
  }
];

// Animation variants for different steps
const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 }
  },
  slideRight: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.5 }
  },
  bounce: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: "spring", stiffness: 300, damping: 15 }
  },
  pulse: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 1, repeat: 1 }
  }
};

interface OnboardingTourProps {
  onComplete: () => void;
  showSkip?: boolean;
}

export function OnboardingTour({ onComplete, showSkip = true }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const [isExiting, setIsExiting] = useState(false);
  const [mascotAnimating, setMascotAnimating] = useState(false);
  
  // Get the last viewed step from localStorage (for resume feature)
  useEffect(() => {
    const savedStep = localStorage.getItem('onboardingStep');
    if (savedStep) {
      const stepIndex = parseInt(savedStep, 10);
      if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < tourSteps.length) {
        setCurrentStep(stepIndex);
      }
    }
  }, []);

  const step = tourSteps[currentStep];
  const animation = animations[step.animation as keyof typeof animations];
  
  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem('onboardingStep', currentStep.toString());
  }, [currentStep]);

  // Progress to next step
  const nextStep = () => {
    // Animate mascot when clicking Next
    setMascotAnimating(true);
    setTimeout(() => setMascotAnimating(false), 800);
    
    if (currentStep < tourSteps.length - 1) {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsExiting(false);
      }, 300);
    } else {
      completeOnboarding();
    }
  };

  // Go back to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsExiting(false);
      }, 300);
    }
  };

  // Complete the onboarding process
  const completeOnboarding = () => {
    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboardingCompleted', 'true');
    // Clear step info when completed
    localStorage.removeItem('onboardingStep');
    
    onComplete();
  };

  // Skip the onboarding tour
  const skipTour = () => {
    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboardingCompleted', 'true');
    // Clear step info when skipped
    localStorage.removeItem('onboardingStep');
    
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col justify-center items-center p-4">
      {/* Progress indicator */}
      <div className="flex space-x-2 mb-8">
        {tourSteps.map((_, index) => (
          <div 
            key={index}
            className={`h-2 w-8 rounded-full transition-colors duration-300 ${
              index === currentStep ? 'bg-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full"
        >
          {/* Farm mascot */}
          <FarmMascot animate={mascotAnimating} />

          {/* Mascot speech bubble */}
          <motion.div 
            className="bg-gray-100 rounded-lg p-4 mb-6 relative" // Increased padding for better readability
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-100"></div>
            <p className="text-center text-gray-700 text-sm sm:text-base">{step.mascotSpeech}</p>
          </motion.div>

          {/* Content */}
          <motion.div 
            className="text-center mb-8"
            {...animation}
          >
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              {step.icon}
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">{step.title}</h2>
            <p className="text-gray-600 text-sm sm:text-base">{step.description}</p>
          </motion.div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`h-12 ${currentStep === 0 ? 'invisible' : ''}`} // Increased height for mobile tapping
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t('onboarding.navigation.back', 'Back')}
            </Button>

            <Button 
              onClick={nextStep}
              className="ml-auto h-12 px-6" // Increased size for easier mobile tapping
              size="lg"
            >
              {currentStep < tourSteps.length - 1 ? (
                <>
                  {t('onboarding.navigation.next', 'Next')}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  {t('onboarding.navigation.getStarted', 'Get Started')}
                  <Check className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          {/* Skip button */}
          {showSkip && currentStep < tourSteps.length - 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={skipTour} 
              className="w-full mt-6 h-10 text-gray-500" // Increased height for mobile tapping
            >
              {t('onboarding.navigation.skipTour', 'Skip Tour')}
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
          
          {/* Mobile swipe hint - only show on first step */}
          {currentStep === 0 && (
            <div className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center">
              <ChevronLeft className="h-3 w-3 mr-1" />
              {t('onboarding.navigation.swipeHint', 'Swipe or tap buttons to navigate')}
              <ChevronRight className="h-3 w-3 ml-1" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}