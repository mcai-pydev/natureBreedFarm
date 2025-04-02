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
  X
} from 'lucide-react';

// Farm mascot character that will guide users
const FarmMascot = () => (
  <motion.div 
    className="relative w-24 h-24 mx-auto mb-4"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.2, duration: 0.5 }}
  >
    <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center">
      <Home className="h-12 w-12 text-green-600" />
    </div>
    <motion.div 
      className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold shadow-md"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.8, type: 'spring' }}
    >
      <span>!</span>
    </motion.div>
  </motion.div>
);

// Tour content for each step
const tourSteps = [
  {
    title: "Welcome to Nature Breed Farm!",
    description: "A platform designed especially for farmers like you to manage your farm with ease.",
    icon: <Home className="h-12 w-12 text-green-600" />,
    mascotSpeech: "Hi there! I'm Sprout, your farm guide. Let me show you around!",
    animation: "fadeIn"
  },
  {
    title: "Shop Farm Products",
    description: "Browse through goats, fish, ducks, chickens, rabbits, snails, and vegetables.",
    icon: <ShoppingCart className="h-12 w-12 text-blue-600" />,
    mascotSpeech: "Our shop makes it easy to find what you need for your farm!",
    animation: "slideRight"
  },
  {
    title: "Animal Breeding",
    description: "Keep track of your animals' family trees and get breeding suggestions.",
    icon: <Users className="h-12 w-12 text-purple-600" />,
    mascotSpeech: "Never lose track of your animal lineage again!",
    animation: "bounce"
  },
  {
    title: "Track Your Farm Progress",
    description: "View reports and statistics to see how your farm is doing.",
    icon: <LineChart className="h-12 w-12 text-orange-600" />,
    mascotSpeech: "Data to help your farm grow better every season!",
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

  const step = tourSteps[currentStep];
  const animation = animations[step.animation as keyof typeof animations];

  // Progress to next step
  const nextStep = () => {
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
    onComplete();
    setLocation('/');
  };

  // Skip the onboarding tour
  const skipTour = () => {
    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboardingCompleted', 'true');
    onComplete();
    setLocation('/');
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
          <FarmMascot />

          {/* Mascot speech bubble */}
          <motion.div 
            className="bg-gray-100 rounded-lg p-3 mb-6 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-100"></div>
            <p className="text-center text-gray-700">{step.mascotSpeech}</p>
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
            <p className="text-gray-600">{step.description}</p>
          </motion.div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={currentStep === 0 ? 'invisible' : ''}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button 
              onClick={nextStep}
              className="ml-auto"
            >
              {currentStep < tourSteps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Get Started
                  <Check className="ml-2 h-4 w-4" />
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
              className="w-full mt-6 text-gray-500"
            >
              Skip Tour
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}