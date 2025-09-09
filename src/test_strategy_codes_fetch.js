// Test script to verify strategy codes fetching logic
// This simulates what happens in ActivateStrategies.js

console.log('Testing frontend strategy codes logic...');

// Mock the response we expect from the API based on our backend test
const mockApiResponse = [
  {
    id: 5,
    name: 'stddev_breakout',
    is_active: true,
    is_validated: true,
    user_id: 39,
    created_at: '2025-09-03T06:27:08.650606'
  }
];

// Simulate the frontend logic
const simulateFrontendLogic = (strategyCodes) => {
  console.log('Strategy codes received:', strategyCodes);
  
  // This is the filtering logic from ActivateStrategyModal.js
  const activeValidatedCodes = strategyCodes.filter(code => code.is_active && code.is_validated);
  console.log('Active & validated codes:', activeValidatedCodes);
  
  // This is the dropdown rendering logic
  console.log('\nDropdown options that should be rendered:');
  activeValidatedCodes.forEach(code => {
    let displayName = code.name;
    if (code.name === 'stddev_breakout') {
      displayName = 'Standard Deviation Breakout';
    } else if (code.name === 'momentum_scalper') {
      displayName = 'Momentum Scalper';
    } else if (code.name === 'mean_reversion') {
      displayName = 'Mean Reversion';
    } else {
      displayName = code.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    console.log(`<option value="${code.id}">${displayName} ✓ (Engine)</option>`);
  });
};

// Test with our mock data
simulateFrontendLogic(mockApiResponse);

// Also test what happens with empty array (current issue)
console.log('\n--- Testing with empty array (current issue) ---');
simulateFrontendLogic([]);