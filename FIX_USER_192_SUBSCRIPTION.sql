-- ===================================================================
-- FIX FOR USER 192 - BREAK N ENTER SUBSCRIPTION
-- ===================================================================
-- Problem: User 192 paid for Break N Enter strategy but doesn't see it.
-- Root Cause: Missing entry in the webhook_subscriptions table.
-- Stripe Sub ID: sub_1SIGksD3oMVy2RzcaHNPlII8
-- ===================================================================

-- STEP 1: VERIFY THE PURCHASE RECORD EXISTS (RUN THIS FIRST)
-- This should return one row for user 192 and webhook 117.
SELECT *
FROM strategy_purchases
WHERE user_id = 192
  AND stripe_subscription_id = 'sub_1SIGksD3oMVy2RzcaHNPlII8';

-- STEP 2: INSERT THE MISSING webhook_subscriptions ENTRY
-- This is the command that will fix the issue.
-- It grants the user access to the strategy in the app.
-- We use 'hybrid' as the strategy_type, consistent with other subscribers.
INSERT INTO webhook_subscriptions (
    webhook_id,
    user_id,
    subscribed_at,
    strategy_type
) VALUES (
    117,          -- webhook_id for "Break N Enter"
    192,          -- user_id
    NOW(),        -- subscribed_at
    'hybrid'      -- strategy_type (matching other subscribers)
);

-- STEP 3: VERIFY THE FIX
-- This query should now show user 192 with the Break N Enter subscription.
SELECT *
FROM webhook_subscriptions
WHERE user_id = 192 AND webhook_id = 117;