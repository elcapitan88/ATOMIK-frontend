/**
 * Feature Flag Usage Examples
 * 
 * This component demonstrates various ways to use the feature flag system
 * in the application. It serves as both documentation and testing interface.
 */

import React, { useState } from 'react';
import useFeatureFlags from '../../hooks/useFeatureFlags';
import FeatureGate, { 
  withFeatureGate, 
  AdvancedAnalyticsGate, 
  NewDashboardGate,
  ExperimentalTradingGate,
  AiInsightsGate,
  SocialTradingGate,
  MobileAppPreviewGate
} from '../common/FeatureGate';
import BetaBadge from '../common/BetaBadge';
import ComingSoon from '../common/ComingSoon';
import './FeatureFlagExamples.css';

const FeatureFlagExamples = () => {
  const [selectedExample, setSelectedExample] = useState('basic');
  const {
    features,
    loading,
    error,
    isBetaTester,
    featureCount,
    isFeatureEnabled,
    hasAdvancedAnalytics,
    hasNewDashboard,
    hasExperimentalTrading,
    hasAiInsights,
    hasSocialTrading,
    hasMobileAppPreview,
    getEnabledFeaturesByCategories,
    refreshFeatures
  } = useFeatureFlags();

  if (loading) {
    return <div className="examples-loading">Loading feature flags...</div>;
  }

  if (error) {
    return <div className="examples-error">Error loading features: {error}</div>;
  }

  // Example components for demonstration
  const AdvancedAnalyticsComponent = () => (
    <div className="demo-component analytics">
      <h3>🔬 Advanced Analytics</h3>
      <p>This is the advanced analytics dashboard with predictive insights.</p>
      <div className="demo-features">
        <div className="feature-item">📊 Predictive Charts</div>
        <div className="feature-item">🎯 Smart Alerts</div>
        <div className="feature-item">📈 Advanced Metrics</div>
      </div>
    </div>
  );

  const ExperimentalTradingComponent = () => (
    <div className="demo-component trading">
      <h3>⚡ Experimental Trading</h3>
      <p>Next-generation trading features with AI-powered automation.</p>
      <div className="demo-features">
        <div className="feature-item">🤖 AI Order Routing</div>
        <div className="feature-item">⚡ Smart Execution</div>
        <div className="feature-item">📊 Advanced Order Types</div>
      </div>
    </div>
  );

  const SocialTradingComponent = () => (
    <div className="demo-component social">
      <h3>👥 Social Trading</h3>
      <p>Connect with other traders and follow successful strategies.</p>
      <div className="demo-features">
        <div className="feature-item">👤 Follow Traders</div>
        <div className="feature-item">📋 Copy Strategies</div>
        <div className="feature-item">💬 Trading Chat</div>
      </div>
    </div>
  );

  // HOC example component
  const ProtectedComponent = withFeatureGate('ai-insights', { 
    showComingSoon: true,
    requireBetaAccess: true 
  })(() => (
    <div className="demo-component ai">
      <h3>🧠 AI Insights</h3>
      <p>AI-powered trading insights and recommendations.</p>
    </div>
  ));

  const enabledByCategory = getEnabledFeaturesByCategories();

  const examples = {
    basic: {
      title: 'Basic Feature Gating',
      description: 'Simple on/off feature control',
      component: (
        <div className="example-section">
          <FeatureGate feature="advanced-analytics" showComingSoon>
            <AdvancedAnalyticsComponent />
          </FeatureGate>
        </div>
      )
    },
    beta: {
      title: 'Beta Access Required',
      description: 'Features requiring beta tester status',
      component: (
        <div className="example-section">
          <FeatureGate 
            feature="experimental-trading" 
            requireBetaAccess 
            showComingSoon
            fallback={
              <div className="access-denied">
                <h3>🔒 Beta Access Required</h3>
                <p>This feature is only available to beta testers.</p>
                {!isBetaTester && (
                  <button className="request-access-btn">
                    Request Beta Access
                  </button>
                )}
              </div>
            }
          >
            <ExperimentalTradingComponent />
          </FeatureGate>
        </div>
      )
    },
    specific: {
      title: 'Specific Feature Gates',
      description: 'Pre-configured feature gates for common features',
      component: (
        <div className="example-section">
          <div className="gate-examples">
            <AdvancedAnalyticsGate showComingSoon>
              <div className="mini-demo">Advanced Analytics Feature</div>
            </AdvancedAnalyticsGate>
            
            <NewDashboardGate showComingSoon>
              <div className="mini-demo">New Dashboard UI</div>
            </NewDashboardGate>
            
            <ExperimentalTradingGate showComingSoon>
              <div className="mini-demo">Experimental Trading</div>
            </ExperimentalTradingGate>
            
            <AiInsightsGate showComingSoon>
              <div className="mini-demo">AI Insights</div>
            </AiInsightsGate>
            
            <SocialTradingGate showComingSoon>
              <div className="mini-demo">Social Trading</div>
            </SocialTradingGate>
            
            <MobileAppPreviewGate showComingSoon>
              <div className="mini-demo">Mobile App Preview</div>
            </MobileAppPreviewGate>
          </div>
        </div>
      )
    },
    hoc: {
      title: 'Higher-Order Component',
      description: 'Using withFeatureGate HOC',
      component: (
        <div className="example-section">
          <ProtectedComponent />
        </div>
      )
    },
    hooks: {
      title: 'Hook Usage',
      description: 'Using the useFeatureFlags hook directly',
      component: (
        <div className="example-section">
          <div className="hook-examples">
            <div className="hook-example">
              <h4>Individual Feature Checks:</h4>
              <ul>
                <li>Advanced Analytics: {hasAdvancedAnalytics ? '✅' : '❌'}</li>
                <li>New Dashboard: {hasNewDashboard ? '✅' : '❌'}</li>
                <li>Experimental Trading: {hasExperimentalTrading ? '✅' : '❌'}</li>
                <li>AI Insights: {hasAiInsights ? '✅' : '❌'}</li>
                <li>Social Trading: {hasSocialTrading ? '✅' : '❌'}</li>
                <li>Mobile Preview: {hasMobileAppPreview ? '✅' : '❌'}</li>
              </ul>
            </div>
            
            <div className="hook-example">
              <h4>Conditional Rendering:</h4>
              {isFeatureEnabled('advanced-analytics') ? (
                <div className="enabled-feature">
                  Advanced Analytics is enabled!
                  <BetaBadge variant="pill" size="sm" />
                </div>
              ) : (
                <div className="disabled-feature">
                  Advanced Analytics is not available
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    categories: {
      title: 'Features by Category',
      description: 'Organizing features by their categories',
      component: (
        <div className="example-section">
          <div className="category-grid">
            {Object.entries(enabledByCategory).map(([category, categoryFeatures]) => (
              <div key={category} className="category-card">
                <h4>{category}</h4>
                <div className="category-features">
                  {categoryFeatures.length > 0 ? (
                    categoryFeatures.map(feature => (
                      <div key={feature} className="category-feature">
                        ✅ {feature}
                      </div>
                    ))
                  ) : (
                    <div className="no-features">No features enabled</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  };

  return (
    <div className="feature-flag-examples">
      <div className="examples-header">
        <h1>Feature Flag Examples</h1>
        <p>Demonstrations of feature flag usage patterns</p>
        
        <div className="user-status">
          <div className="status-item">
            <strong>Beta Tester:</strong> {isBetaTester ? '✅ Yes' : '❌ No'}
            {isBetaTester && <BetaBadge variant="pill" size="sm" />}
          </div>
          <div className="status-item">
            <strong>Enabled Features:</strong> {featureCount}
          </div>
          <button className="refresh-btn" onClick={refreshFeatures}>
            🔄 Refresh Features
          </button>
        </div>
      </div>

      <div className="examples-navigation">
        {Object.entries(examples).map(([key, example]) => (
          <button
            key={key}
            className={`nav-btn ${selectedExample === key ? 'active' : ''}`}
            onClick={() => setSelectedExample(key)}
          >
            {example.title}
          </button>
        ))}
      </div>

      <div className="example-content">
        <div className="example-info">
          <h2>{examples[selectedExample].title}</h2>
          <p>{examples[selectedExample].description}</p>
        </div>
        
        <div className="example-demo">
          {examples[selectedExample].component}
        </div>
      </div>

      <div className="feature-status-panel">
        <h3>Current Feature Status</h3>
        <div className="feature-list">
          {Object.entries(features).map(([feature, enabled]) => (
            <div key={feature} className={`feature-status ${enabled ? 'enabled' : 'disabled'}`}>
              <span className="feature-name">{feature}</span>
              <span className="feature-toggle">{enabled ? '✅' : '❌'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureFlagExamples;