import React, { useState, useCallback } from 'react';
import GlassModal from '../../../common/Modal/GlassModal';
import { useCreatorOnboarding } from '../../../../hooks/useCreatorOnboarding';
import OnboardingStep1Welcome from './OnboardingStep1Welcome';
import OnboardingStep2Profile from './OnboardingStep2Profile';
import OnboardingStep3TaxInfo from './OnboardingStep3TaxInfo';
import OnboardingStep4Stripe from './OnboardingStep4Stripe';
import OnboardingStep5Strategy from './OnboardingStep5Strategy';
import OnboardingSuccess from './OnboardingSuccess';

const CreatorOnboardingModal = ({ isOpen, onClose }) => {
  const {
    currentStep,
    completedSteps,
    onboardingData,
    nextStep,
    previousStep,
    updateData,
    completeOnboarding,
    resetOnboarding
  } = useCreatorOnboarding();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStepComplete = useCallback(async (stepData) => {
    setIsSubmitting(true);
    try {
      await updateData(stepData);
      if (currentStep === 5) {
        await completeOnboarding();
      } else {
        nextStep();
      }
    } catch (error) {
      console.error('Step completion failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, updateData, completeOnboarding, nextStep]);

  const handleClose = useCallback(() => {
    if (currentStep === 6) {
      resetOnboarding();
    }
    onClose();
  }, [currentStep, resetOnboarding, onClose]);

  const renderStep = () => {
    const stepProps = {
      data: onboardingData,
      onNext: handleStepComplete,
      onBack: previousStep,
      isSubmitting,
      completedSteps
    };

    switch (currentStep) {
      case 1:
        return <OnboardingStep1Welcome {...stepProps} />;
      case 2:
        return <OnboardingStep2Profile {...stepProps} />;
      case 3:
        return <OnboardingStep3TaxInfo {...stepProps} />;
      case 4:
        return <OnboardingStep4Stripe {...stepProps} />;
      case 5:
        return <OnboardingStep5Strategy {...stepProps} />;
      case 6:
        return <OnboardingSuccess onClose={handleClose} />;
      default:
        return <OnboardingStep1Welcome {...stepProps} />;
    }
  };

  const progressPercentage = ((currentStep - 1) / 5) * 100;

  return (
    <GlassModal 
      isOpen={isOpen} 
      onClose={handleClose}
      className="creator-onboarding-modal"
      maxWidth="600px"
    >
      <div className="onboarding-container">
        {currentStep < 6 && (
          <div className="progress-header">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="step-indicator">
              Step {currentStep} of 5
            </span>
          </div>
        )}
        
        <div className="step-content">
          {renderStep()}
        </div>
      </div>

      <style jsx>{`
        .onboarding-container {
          padding: 0;
          min-height: 500px;
        }

        .progress-header {
          padding: 24px 32px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .step-indicator {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 500;
        }

        .step-content {
          padding: 32px;
          flex: 1;
        }

        .creator-onboarding-modal {
          backdrop-filter: blur(20px);
        }
      `}</style>
    </GlassModal>
  );
};

export default CreatorOnboardingModal;