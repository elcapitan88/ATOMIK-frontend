-- ===================================================================
-- FIX FOR USER 188 - BREAK N ENTER SUBSCRIPTION
-- ===================================================================
-- Problem: User 188 paid for Break N Enter strategy but doesn't see it in dropdown
-- Root Cause: Missing entry in webhook_subscriptions table
-- ===================================================================

-- STEP 1: INSERT THE MISSING webhook_subscriptions ENTRY
-- This is what makes the strategy appear in the dropdown
INSERT INTO webhook_subscriptions (
    webhook_id,
    user_id,
    subscribed_at,
    strategy_type,
    strategy_id,
    strategy_code_id
) VALUES (
    117,          -- webhook_id for Break N Enter
    188,          -- user_id
    NOW(),        -- subscribed_at
    'hybrid',     -- strategy_type (matching other Break N Enter subscribers)
    NULL,         -- strategy_id (not used for this type)
    NULL          -- strategy_code_id (Break N Enter uses webhook, not engine code)
);

-- STEP 2: VERIFY THE FIX
-- This query should show user 188 with the Break N Enter subscription
SELECT
    ws.user_id,
    u.email,
    ws.webhook_id,
    w.name as webhook_name,
    ws.strategy_type,
    ws.subscribed_at,
    sp.stripe_subscription_id,
    sp.status as purchase_status
FROM webhook_subscriptions ws
JOIN users u ON ws.user_id = u.id
JOIN webhooks w ON ws.webhook_id = w.id
LEFT JOIN strategy_purchases sp ON sp.user_id = ws.user_id AND sp.webhook_id = ws.webhook_id
WHERE ws.user_id = 188;

-- STEP 3: CONFIRM USER 188 NOW HAS ACCESS LIKE OTHER SUBSCRIBERS
-- Compare with other Break N Enter subscribers to ensure consistency
SELECT
    ws.user_id,
    u.email,
    ws.strategy_type,
    ws.subscribed_at,
    sp.status as purchase_status
FROM webhook_subscriptions ws
JOIN users u ON ws.user_id = u.id
LEFT JOIN strategy_purchases sp ON sp.user_id = ws.user_id AND sp.webhook_id = ws.webhook_id
WHERE ws.webhook_id = 117
ORDER BY ws.user_id;

-- After running these queries, user 188 should be able to see
-- Break N Enter in the strategy dropdown!