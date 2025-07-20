import { useState, useEffect, useCallback } from 'react';
import { useCreator } from './useCreator';
import { useAuth } from '@/contexts/AuthContext';

const ONBOARDING_STORAGE_KEY = 'creator_onboarding_progress';

const initialOnboardingData = {
  profile: {
    displayName: '',
    bio: '',
    website: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      discord: ''
    }
  },
  taxInfo: {
    businessType: '',
    taxId: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  },
  stripe: {
    accountId: null,
    onboardingComplete: false
  },
  strategy: {
    strategyId: null,
    pricing: {
      type: 'monthly',
      price: 0
    }
  }
};

export const useCreatorOnboarding = () => {
  const { useUpdateProfile, useBecomeCreator } = useCreator();
  const { user } = useAuth();
  const updateProfileMutation = useUpdateProfile();
  const becomeCreatorMutation = useBecomeCreator();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [onboardingData, setOnboardingData] = useState(initialOnboardingData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedProgress = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (savedProgress) {
      try {
        const { step, completed, data } = JSON.parse(savedProgress);
        setCurrentStep(step);
        setCompletedSteps(new Set(completed));
        setOnboardingData({ ...initialOnboardingData, ...data });
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
      }
    }
  }, []);

  // Pre-populate user data when user is available
  useEffect(() => {
    if (user && !localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
      const prePopulatedData = {
        ...initialOnboardingData,
        profile: {
          ...initialOnboardingData.profile,
          displayName: user.full_name || user.username || '',
          website: user.website || '',
          socialLinks: {
            twitter: user.x_handle || '',
            tiktok: user.tiktok_handle || '',
            instagram: user.instagram_handle || '',
            youtube: user.youtube_handle || '',
            discord: user.discord_handle || ''
          }
        }
      };
      setOnboardingData(prePopulatedData);
    }
  }, [user]);

  const saveProgress = useCallback((step, completed, data) => {
    const progressData = {
      step,
      completed: Array.from(completed),
      data
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progressData));
  }, []);

  const updateData = useCallback(async (stepData) => {
    setIsLoading(true);
    try {
      const updatedData = { ...onboardingData, ...stepData };
      setOnboardingData(updatedData);
      
      const newCompletedSteps = new Set([...completedSteps, currentStep]);
      setCompletedSteps(newCompletedSteps);
      
      saveProgress(currentStep, newCompletedSteps, updatedData);

      if (currentStep === 2 && stepData.profile) {
        // Save profile data including social links to user profile
        const profileUpdateData = {
          full_name: stepData.profile.displayName,
          website: stepData.profile.website,
          socialMedia: stepData.profile.socialLinks
        };
        await updateProfileMutation.mutateAsync(profileUpdateData);
      }

      if (currentStep === 4 && stepData.stripe) {
        // Stripe account creation is handled by the Stripe Connect button
        // Just save the account ID when it comes back
      }

      return updatedData;
    } catch (error) {
      console.error('Failed to update onboarding data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onboardingData, completedSteps, currentStep, saveProgress, updateProfileMutation]);

  const nextStep = useCallback(() => {
    const newStep = Math.min(currentStep + 1, 6);
    setCurrentStep(newStep);
    saveProgress(newStep, completedSteps, onboardingData);
  }, [currentStep, completedSteps, onboardingData, saveProgress]);

  const previousStep = useCallback(() => {
    const newStep = Math.max(currentStep - 1, 1);
    setCurrentStep(newStep);
    saveProgress(newStep, completedSteps, onboardingData);
  }, [currentStep, completedSteps, onboardingData, saveProgress]);

  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= 6) {
      setCurrentStep(step);
      saveProgress(step, completedSteps, onboardingData);
    }
  }, [completedSteps, onboardingData, saveProgress]);

  const completeOnboarding = useCallback(async () => {
    setIsLoading(true);
    try {
      // Create the creator profile (social links are already saved to user profile)
      await becomeCreatorMutation.mutateAsync({
        display_name: onboardingData.profile.displayName,
        bio: onboardingData.profile.bio,
        trading_experience: 'intermediate' // Default value
      });

      setCurrentStep(6);
      const allCompleted = new Set([1, 2, 3, 4, 5]);
      setCompletedSteps(allCompleted);
      saveProgress(6, allCompleted, onboardingData);
      
      return true;
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onboardingData, becomeCreatorMutation, saveProgress]);

  const resetOnboarding = useCallback(() => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setOnboardingData(initialOnboardingData);
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }, []);

  const isStepCompleted = useCallback((step) => {
    return completedSteps.has(step);
  }, [completedSteps]);

  const canProceedToStep = useCallback((step) => {
    if (step <= 1) return true;
    return isStepCompleted(step - 1);
  }, [isStepCompleted]);

  const getStepValidation = useCallback((step) => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return onboardingData.profile.displayName && onboardingData.profile.bio;
      case 3:
        return onboardingData.taxInfo.businessType && 
               onboardingData.taxInfo.address.street &&
               onboardingData.taxInfo.address.city;
      case 4:
        return onboardingData.stripe.onboardingComplete;
      case 5:
        return onboardingData.strategy.strategyId && 
               onboardingData.strategy.pricing.price > 0;
      default:
        return false;
    }
  }, [onboardingData]);

  return {
    currentStep,
    completedSteps,
    onboardingData,
    isLoading,
    nextStep,
    previousStep,
    goToStep,
    updateData,
    completeOnboarding,
    resetOnboarding,
    isStepCompleted,
    canProceedToStep,
    getStepValidation,
    progress: {
      percentage: ((currentStep - 1) / 5) * 100,
      completedCount: completedSteps.size,
      totalSteps: 5
    }
  };
};