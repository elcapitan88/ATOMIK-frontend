import psycopg2
import sys
import io
from datetime import datetime

# Set UTF-8 encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Database connection
DB_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def investigate_completed_status():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    print("=" * 80)
    print("INVESTIGATING 'COMPLETED' vs 'active' STATUS ISSUE")
    print("=" * 80)

    # 1. Check distinct statuses in strategy_purchases
    print("\n1. DISTINCT STATUSES IN strategy_purchases TABLE:")
    cur.execute("""
        SELECT DISTINCT status, COUNT(*) as count
        FROM strategy_purchases
        WHERE webhook_id IN (117, 120)
        GROUP BY status
        ORDER BY count DESC
    """)

    statuses = cur.fetchall()
    for status in statuses:
        print(f"   Status '{status[0]}': {status[1]} purchases")

    # 2. Check COMPLETED purchases for Break N Enter
    print("\n2. USERS WITH 'COMPLETED' STATUS FOR BREAK N ENTER (webhook 117):")
    cur.execute("""
        SELECT
            sp.user_id,
            u.email,
            sp.status,
            sp.stripe_subscription_id,
            sp.amount_paid,
            sp.created_at,
            sp.cancelled_at,
            CASE
                WHEN ws.id IS NOT NULL THEN '✓ Has webhook_subscription'
                ELSE '❌ NO webhook_subscription'
            END as sub_status
        FROM strategy_purchases sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN webhook_subscriptions ws ON ws.user_id = sp.user_id AND ws.webhook_id = sp.webhook_id
        WHERE sp.webhook_id = 117
        AND sp.status = 'COMPLETED'
        ORDER BY sp.created_at
    """)

    completed_purchases = cur.fetchall()

    missing_webhook_subs = []

    for purchase in completed_purchases:
        print(f"\n   User {purchase[0]} ({purchase[1]})")
        print(f"      Status: {purchase[2]}")
        print(f"      Stripe Sub: {purchase[3]}")
        print(f"      Amount Paid: ${purchase[4]}")
        print(f"      Created: {purchase[5]}")
        print(f"      Cancelled: {purchase[6]}")
        print(f"      Webhook Sub: {purchase[7]}")

        if purchase[7] == '❌ NO webhook_subscription':
            missing_webhook_subs.append(purchase)

    # 3. Check if COMPLETED means active subscription
    print("\n3. CHECKING IF 'COMPLETED' MEANS ACTIVE SUBSCRIPTION:")
    print("   (Likely 'COMPLETED' = payment completed, should be active)")

    # 4. Generate fixes for COMPLETED purchases without webhook_subscriptions
    if missing_webhook_subs:
        print("\n" + "=" * 80)
        print("🔧 FIX: Add webhook_subscriptions for COMPLETED purchases")
        print("=" * 80)

        print("\n-- SQL to add missing webhook_subscriptions for COMPLETED Break N Enter purchases:")
        for purchase in missing_webhook_subs:
            user_id = purchase[0]
            email = purchase[1]

            print(f"\n-- Fix for User {user_id} ({email})")
            print(f"""INSERT INTO webhook_subscriptions (
    webhook_id,
    user_id,
    subscribed_at,
    strategy_type,
    strategy_id,
    strategy_code_id
) VALUES (
    117,        -- Break N Enter webhook
    {user_id},  -- user_id
    NOW(),
    'hybrid',
    NULL,
    NULL
) ON CONFLICT DO NOTHING;""")

    # 5. Check if we should also update COMPLETED to 'active'
    print("\n" + "=" * 80)
    print("🔧 ALTERNATIVE FIX: Update status from COMPLETED to active")
    print("=" * 80)

    print("""
-- Update all COMPLETED Break N Enter purchases to 'active' status
-- (Run this if COMPLETED purchases should be treated as active)

UPDATE strategy_purchases
SET status = 'active',
    updated_at = NOW()
WHERE webhook_id = 117
AND status = 'COMPLETED'
AND cancelled_at IS NULL;

-- Then add webhook_subscriptions for all active purchases
INSERT INTO webhook_subscriptions (webhook_id, user_id, subscribed_at, strategy_type)
SELECT
    sp.webhook_id,
    sp.user_id,
    NOW(),
    'hybrid'
FROM strategy_purchases sp
WHERE sp.webhook_id = 117
AND sp.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM webhook_subscriptions ws
    WHERE ws.user_id = sp.user_id AND ws.webhook_id = sp.webhook_id
);
    """)

    # 6. Summary
    print("\n" + "=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)

    cur.execute("""
        SELECT COUNT(DISTINCT user_id)
        FROM strategy_purchases
        WHERE webhook_id = 117
        AND status IN ('COMPLETED', 'active')
        AND cancelled_at IS NULL
    """)

    total_should_have_access = cur.fetchone()[0]

    print(f"\n   Total users who should have Break N Enter access: {total_should_have_access}")
    print(f"   Users with 'COMPLETED' status missing webhook_subscription: {len(missing_webhook_subs)}")
    print("\n   RECOMMENDATION:")
    print("   1. Update COMPLETED to 'active' for uncancelled purchases")
    print("   2. Add webhook_subscriptions for all active purchases")
    print("   3. This will ensure all paying users can see Break N Enter in dropdown")

    cur.close()
    conn.close()

if __name__ == "__main__":
    investigate_completed_status()