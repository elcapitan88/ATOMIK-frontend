import React, { useState, useEffect } from 'react';
import FormInput from '../../../common/Form/FormInput';
import { useAuth } from '../../../../contexts/AuthContext';

const OnboardingStep2Profile = ({ data, onNext, onBack, isSubmitting }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: data?.profile?.bio || '',
    website: data?.profile?.website || '',
    socialLinks: {
      twitter: data?.profile?.socialLinks?.twitter || '',
      tiktok: data?.profile?.socialLinks?.tiktok || '',
      instagram: data?.profile?.socialLinks?.instagram || '',
      youtube: data?.profile?.socialLinks?.youtube || '',
      discord: data?.profile?.socialLinks?.discord || ''
    }
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 2) {
      newErrors.username = 'Username must be at least 2 characters';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length < 20) {
      newErrors.bio = 'Bio must be at least 20 characters';
    } else if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    if (formData.socialLinks.twitter && !isValidTwitterHandle(formData.socialLinks.twitter)) {
      newErrors.twitter = 'Please enter a valid Twitter handle (without @)';
    }

    if (formData.socialLinks.tiktok && !isValidHandle(formData.socialLinks.tiktok)) {
      newErrors.tiktok = 'Please enter a valid TikTok handle (without @)';
    }

    if (formData.socialLinks.instagram && !isValidHandle(formData.socialLinks.instagram)) {
      newErrors.instagram = 'Please enter a valid Instagram handle (without @)';
    }

    if (formData.socialLinks.youtube && !isValidYouTubeChannel(formData.socialLinks.youtube)) {
      newErrors.youtube = 'Please enter a valid YouTube channel URL or handle';
    }

    if (formData.socialLinks.discord && !isValidDiscordHandle(formData.socialLinks.discord)) {
      newErrors.discord = 'Please enter a valid Discord handle';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const isValidTwitterHandle = (handle) => {
    return /^[A-Za-z0-9_]{1,15}$/.test(handle);
  };

  const isValidHandle = (handle) => {
    return /^[A-Za-z0-9_.]{1,30}$/.test(handle);
  };

  const isValidYouTubeChannel = (channel) => {
    // Accept either @handle, youtube.com URLs, or just channel names
    if (channel.startsWith('@')) {
      return /^@[A-Za-z0-9_.]{1,30}$/.test(channel);
    }
    if (channel.includes('youtube.com')) {
      return isValidUrl(channel);
    }
    return /^[A-Za-z0-9_.]{1,30}$/.test(channel);
  };

  const isValidDiscordHandle = (handle) => {
    return /^.{2,32}#[0-9]{4}$/.test(handle) || /^[A-Za-z0-9_.]{2,32}$/.test(handle);
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    if (errors[field] || errors[field.split('.')[1]]) {
      setErrors(prev => ({ ...prev, [field]: '', [field.split('.')[1]]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onNext({ profile: formData });
    }
  };

  const isFormValid = formData.username.trim() && formData.bio.trim();

  return (
    <div className="profile-step">
      <div className="step-header">
        <h2>Create Your Profile</h2>
        <p>Set up your creator profile and tell potential subscribers about yourself and your trading expertise</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <FormInput
            label="Username *"
            placeholder="Your creator username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            error={errors.username}
            maxLength={30}
          />
          <div className="char-count">
            {formData.username.length}/30
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">Bio *</label>
          <textarea
            className={`form-textarea ${errors.bio ? 'error' : ''}`}
            placeholder="Describe your trading experience, strategies, and what makes you unique..."
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            maxLength={500}
            rows={4}
          />
          {errors.bio && <span className="error-text">{errors.bio}</span>}
          <div className="char-count">
            {formData.bio.length}/500
          </div>
        </div>

        <div className="form-section">
          <FormInput
            label="Website"
            placeholder="https://yourwebsite.com"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            error={errors.website}
          />
        </div>

        <div className="social-section">
          <h4>Social Links</h4>
          <p className="section-subtitle">Help subscribers connect with you</p>
          
          <div className="social-inputs">
            <FormInput
              label="X (Twitter) Handle"
              placeholder="username (without @)"
              value={formData.socialLinks.twitter}
              onChange={(e) => handleInputChange('socialLinks.twitter', e.target.value)}
              error={errors.twitter}
              prefix="@"
            />

            <FormInput
              label="TikTok Handle"
              placeholder="username (without @)"
              value={formData.socialLinks.tiktok}
              onChange={(e) => handleInputChange('socialLinks.tiktok', e.target.value)}
              error={errors.tiktok}
              prefix="@"
            />

            <FormInput
              label="Instagram Handle"
              placeholder="username (without @)"
              value={formData.socialLinks.instagram}
              onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
              error={errors.instagram}
              prefix="@"
            />

            <FormInput
              label="YouTube Channel"
              placeholder="@channel or youtube.com/c/channel"
              value={formData.socialLinks.youtube}
              onChange={(e) => handleInputChange('socialLinks.youtube', e.target.value)}
              error={errors.youtube}
            />

            <FormInput
              label="Discord"
              placeholder="username#1234 or username"
              value={formData.socialLinks.discord}
              onChange={(e) => handleInputChange('socialLinks.discord', e.target.value)}
              error={errors.discord}
            />
          </div>
        </div>

        <div className="step-actions">
          <button 
            type="button" 
            className="secondary-button"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </button>
          <button 
            type="submit" 
            className="primary-button"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .profile-step {
          max-width: 500px;
          margin: 0 auto;
        }

        .step-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .step-header h2 {
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 6px 0;
        }

        .step-header p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-size: 14px;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-section {
          position: relative;
        }

        .form-label {
          display: block;
          color: white;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .form-textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px;
          color: white;
          font-size: 14px;
          resize: vertical;
          min-height: 80px;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #00C6E0;
          box-shadow: 0 0 0 3px rgba(0, 198, 224, 0.1);
        }

        .form-textarea.error {
          border-color: #ef4444;
        }

        .form-textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .char-count {
          position: absolute;
          right: 8px;
          bottom: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .error-text {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .social-section {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          padding: 16px;
        }

        .social-section h4 {
          color: white;
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 3px 0;
        }

        .section-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin: 0 0 12px 0;
        }

        .social-inputs {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .step-actions {
          display: flex;
          gap: 10px;
          justify-content: space-between;
          margin-top: 20px;
        }

        .primary-button, .secondary-button {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .primary-button {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          flex: 1;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
        }

        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .secondary-button {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .secondary-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
};

export default OnboardingStep2Profile;