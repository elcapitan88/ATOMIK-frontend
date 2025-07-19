// Debug script for payment warning display issues
// Run this in the browser console when logged in as cruzh5150@gmail.com

// 1. Check if payment status endpoint is working
async function checkPaymentStatusEndpoint() {
  try {
    const response = await fetch('/api/v1/subscriptions/payment-status', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Payment Status Response:', data);
    console.log('Response Status:', response.status);
    
    // Check specific fields
    console.log('has_payment_issues:', data.has_payment_issues);
    console.log('dunning_stage:', data.dunning_stage);
    console.log('is_in_grace_period:', data.is_in_grace_period);
    console.log('days_left_in_grace_period:', data.days_left_in_grace_period);
    
    return data;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return null;
  }
}

// 2. Check React DevTools for PaymentStatusWarning component
function checkComponentRendering() {
  console.log('Instructions to check component rendering:');
  console.log('1. Open React DevTools');
  console.log('2. Search for "PaymentStatusWarning" in the Components tab');
  console.log('3. Check the props being passed to the component');
  console.log('4. Look for paymentStatus prop and its values');
}

// 3. Check SubscriptionContext state
async function checkSubscriptionContext() {
  console.log('To check SubscriptionContext:');
  console.log('1. In React DevTools, find SubscriptionProvider');
  console.log('2. Check the paymentStatus state value');
  console.log('3. Verify it matches the API response');
}

// 4. Manual component test
function testWarningConditions(paymentStatus) {
  console.log('\nTesting warning conditions:');
  
  const hasPaymentIssues = paymentStatus && paymentStatus.has_payment_issues;
  console.log('Has payment issues?', hasPaymentIssues);
  
  if (!hasPaymentIssues) {
    console.log('❌ Warning won\'t show: has_payment_issues is false or undefined');
    return false;
  }
  
  const dunningStage = paymentStatus.dunning_stage;
  console.log('Dunning stage:', dunningStage);
  
  const validStages = ['warning', 'urgent', 'final', 'suspended'];
  if (!validStages.includes(dunningStage)) {
    console.log('❌ Warning won\'t show: Invalid dunning stage');
    return false;
  }
  
  console.log('✅ Warning should show!');
  return true;
}

// 5. Check for console errors
function checkConsoleErrors() {
  console.log('\nCheck browser console for:');
  console.log('- React errors or warnings');
  console.log('- Network errors (check Network tab)');
  console.log('- Any JavaScript errors that might prevent rendering');
}

// Run all checks
async function runAllChecks() {
  console.log('=== Payment Warning Debug Report ===\n');
  
  // Check API
  console.log('1. Checking Payment Status API...');
  const paymentStatus = await checkPaymentStatusEndpoint();
  
  if (paymentStatus) {
    // Test conditions
    console.log('\n2. Testing Warning Conditions...');
    testWarningConditions(paymentStatus);
  }
  
  // Component instructions
  console.log('\n3. Component Rendering Check:');
  checkComponentRendering();
  
  console.log('\n4. Context State Check:');
  checkSubscriptionContext();
  
  console.log('\n5. Console Errors:');
  checkConsoleErrors();
  
  console.log('\n=== End of Debug Report ===');
}

// Auto-run
console.log('Run: runAllChecks() to debug payment warning display');
runAllChecks();