import { useState, useEffect, useCallback } from 'react';
import { useCreator } from './useCreator';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';

const ONBOARDING_STORAGE_KEY = 'creator_onboarding_progress';

const initialOnboardingData = {
  profile: {
    username: '',
    bio: '',
    website: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      discord: ''
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
  const { useBecomeCreator } = useCreator();
  const { user, updateUserProfile } = useAuth();
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
        // Save profile data including social links to user profile (not creator profile)
        try {
          const profileUpdateData = {
            username: stepData.profile.username,
            website: stepData.profile.website,
            socialMedia: stepData.profile.socialLinks
          };
          
          // Use user profile API instead of creator profile API
          const response = await axiosInstance.patch('/api/v1/auth/profile', profileUpdateData);
          
          // Update local auth context with new data
          if (updateUserProfile) {
            updateUserProfile(response.data);
          }

          // Create the creator profile after updating user profile
          await becomeCreatorMutation.mutateAsync({
            bio: stepData.profile.bio,
            trading_experience: 'intermediate' // Default value
          });
          
        } catch (error) {
          console.error('Failed to update user profile or create creator profile during onboarding:', error);
          // Don't throw error to allow onboarding to continue
        }
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
  }, [onboardingData, completedSteps, currentStep, saveProgress, updateUserProfile]);

  const nextStep = useCallback(() => {
    const newStep = Math.min(currentStep + 1, 5);
    setCurrentStep(newStep);
    saveProgress(newStep, completedSteps, onboardingData);
  }, [currentStep, completedSteps, onboardingData, saveProgress]);

  const previousStep = useCallback(() => {
    const newStep = Math.max(currentStep - 1, 1);
    setCurrentStep(newStep);
    saveProgress(newStep, completedSteps, onboardingData);
  }, [currentStep, completedSteps, onboardingData, saveProgress]);

  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
      saveProgress(step, completedSteps, onboardingData);
    }
  }, [completedSteps, onboardingData, saveProgress]);

  const completeOnboarding = useCallback(async () => {
    setIsLoading(true);
    try {
      // Creator profile is already created in Step 2, just finalize the onboarding
      setCurrentStep(5);
      const allCompleted = new Set([1, 2, 3, 4]);
      setCompletedSteps(allCompleted);
      saveProgress(5, allCompleted, onboardingData);
      
      return true;
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onboardingData, saveProgress]);

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
        return onboardingData.profile.username && onboardingData.profile.bio;
      case 3:
        return onboardingData.stripe.onboardingComplete;
      case 4:
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
      percentage: ((currentStep - 1) / 4) * 100,
      completedCount: completedSteps.size,
      totalSteps: 4
    }
  };
};