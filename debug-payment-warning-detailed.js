// Detailed debug script for payment warning issues
// Run this in the browser console when logged in as cruzh5150@gmail.com

// Expected user data based on your description
const EXPECTED_USER_DATA = {
  email: 'cruzh5150@gmail.com',
  dunning_stage: 'warning',
  payment_failed_at: '2025-07-19 19:09:48.271156',
  grace_period_ends_at: '2025-07-26 19:09:48.271156',
  is_lifetime: true
};

// 1. Check the actual API response
async function checkAPIResponse() {
  console.log('=== Checking Payment Status API ===');
  
  try {
    const response = await fetch('/api/v1/subscriptions/payment-status', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`API returned status ${response.status}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('Full API Response:', JSON.stringify(data, null, 2));
    
    // Check critical fields
    console.log('\n--- Critical Fields Check ---');
    console.log('has_payment_issues:', data.has_payment_issues, '(MUST be true for warning to show)');
    console.log('dunning_stage:', data.dunning_stage, `(Expected: "${EXPECTED_USER_DATA.dunning_stage}")`);
    console.log('is_in_grace_period:', data.is_in_grace_period);
    console.log('days_left_in_grace_period:', data.days_left_in_grace_period);
    
    // Check if the response matches expected data
    console.log('\n--- Data Validation ---');
    if (!data.has_payment_issues) {
      console.error('❌ PROBLEM: has_payment_issues is false or missing!');
      console.log('The component will NOT render without this field being true.');
    } else {
      console.log('✅ has_payment_issues is true');
    }
    
    if (data.dunning_stage !== EXPECTED_USER_DATA.dunning_stage) {
      console.warn(`⚠️  dunning_stage mismatch: got "${data.dunning_stage}", expected "${EXPECTED_USER_DATA.dunning_stage}"`);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch payment status:', error);
    return null;
  }
}

// 2. Check React Context State
function checkReactContext() {
  console.log('\n=== React Context Check ===');
  console.log('To check the SubscriptionContext state:');
  console.log('1. Open React DevTools (Components tab)');
  console.log('2. Search for "SubscriptionProvider"');
  console.log('3. Click on it and check the hooks section');
  console.log('4. Look for useState hooks and find paymentStatus');
  console.log('5. Verify it matches the API response above');
}

// 3. Check if component is in the DOM
function checkComponentInDOM() {
  console.log('\n=== DOM Check ===');
  
  // Look for any Alert components that might be the payment warning
  const alerts = document.querySelectorAll('[role="alert"]');
  console.log(`Found ${alerts.length} alert(s) in the DOM`);
  
  // Check for specific text content
  const warningTexts = ['Payment Issue Detected', 'Payment Required', 'Account Suspended'];
  let foundWarning = false;
  
  alerts.forEach((alert, index) => {
    const text = alert.textContent;
    console.log(`Alert ${index + 1}: "${text.substring(0, 100)}..."`);
    
    warningTexts.forEach(warningText => {
      if (text.includes(warningText)) {
        foundWarning = true;
        console.log(`✅ Found payment warning: "${warningText}"`);
      }
    });
  });
  
  if (!foundWarning) {
    console.log('❌ No payment warning found in DOM');
  }
  
  // Check for hidden elements
  const hiddenAlerts = Array.from(alerts).filter(el => {
    const style = window.getComputedStyle(el);
    return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
  });
  
  if (hiddenAlerts.length > 0) {
    console.log(`⚠️  Found ${hiddenAlerts.length} hidden alert(s) - might be payment warnings`);
  }
}

// 4. Test the component logic manually
function testComponentLogic(paymentStatus) {
  console.log('\n=== Component Logic Test ===');
  
  // Simulate the component's warningInfo logic
  if (!paymentStatus || !paymentStatus.has_payment_issues) {
    console.log('❌ Component returns null - no warning will be shown');
    console.log('Reason:', !paymentStatus ? 'No payment status' : 'has_payment_issues is false/missing');
    return null;
  }
  
  const dunningStage = paymentStatus.dunning_stage;
  const validStages = ['warning', 'urgent', 'final', 'suspended'];
  
  if (!validStages.includes(dunningStage)) {
    console.log(`❌ Invalid dunning_stage: "${dunningStage}"`);
    console.log('Valid stages:', validStages);
    return null;
  }
  
  console.log(`✅ Component should render with dunning_stage: "${dunningStage}"`);
  return true;
}

// 5. Check for potential issues
function checkPotentialIssues() {
  console.log('\n=== Potential Issues Check ===');
  
  // Check if user is authenticated
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('❌ No access token found - user might not be authenticated');
  } else {
    console.log('✅ Access token found');
  }
  
  // Check for console errors
  console.log('\nCheck the browser console for:');
  console.log('- Network errors (401, 403, 500, etc.)');
  console.log('- React errors or warnings');
  console.log('- JavaScript errors');
}

// 6. Provide fix suggestions
function suggestFixes(apiData) {
  console.log('\n=== Suggested Fixes ===');
  
  if (!apiData || !apiData.has_payment_issues) {
    console.log('1. Backend Issue: The API is not returning has_payment_issues: true');
    console.log('   - Check the backend logic for /api/v1/subscriptions/payment-status');
    console.log('   - Ensure it sets has_payment_issues = true when dunning_stage is set');
    console.log('   - For lifetime users with payment issues, this should still be true');
  }
  
  if (apiData && apiData.has_payment_issues) {
    console.log('1. Frontend Issue: Component might not be receiving the data');
    console.log('   - Check if SubscriptionContext is properly fetching payment status');
    console.log('   - Verify the component is mounted and not conditionally hidden');
    console.log('   - Check for CSS that might hide the alert');
  }
  
  console.log('\n2. Quick backend check command:');
  console.log('   Run this SQL to verify user data:');
  console.log(`   SELECT email, dunning_stage, payment_failed_at, grace_period_ends_at, is_lifetime`);
  console.log(`   FROM users WHERE email = '${EXPECTED_USER_DATA.email}';`);
}

// Run all checks
async function runFullDiagnostics() {
  console.clear();
  console.log('🔍 Payment Warning Diagnostic Report');
  console.log('=====================================\n');
  
  const apiData = await checkAPIResponse();
  
  checkReactContext();
  checkComponentInDOM();
  
  if (apiData) {
    testComponentLogic(apiData);
  }
  
  checkPotentialIssues();
  suggestFixes(apiData);
  
  console.log('\n=====================================');
  console.log('📋 Diagnostic complete. Scroll up to review all findings.');
}

// Auto-run
runFullDiagnostics();