import psycopg2
import sys
import io

# Set UTF-8 encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Database connection
DB_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def fix_user_190():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    try:
        print("=" * 80)
        print("FIXING USER 190 - MIGRATING TO CORRECT BREAK N ENTER WEBHOOK")
        print("=" * 80)

        # Step 1: Show current state
        print("\n1. CURRENT STATE:")
        cur.execute("""
            SELECT
                sp.webhook_id,
                w.name,
                w.user_id as owner_id,
                u.email as owner_email,
                sp.stripe_subscription_id
            FROM strategy_purchases sp
            JOIN webhooks w ON sp.webhook_id = w.id
            JOIN users u ON w.user_id = u.id
            WHERE sp.user_id = 190 AND sp.status = 'active'
        """)

        current = cur.fetchone()
        if current:
            print(f"   User 190 purchased webhook {current[0]} ({current[1]})")
            print(f"   Owned by user {current[2]} ({current[3]})")
            print(f"   Stripe subscription: {current[4]}")

        # Step 2: Migrate the purchase to the correct webhook
        print("\n2. MIGRATING PURCHASE TO CORRECT WEBHOOK (117):")
        cur.execute("""
            UPDATE strategy_purchases
            SET webhook_id = 117,
                updated_at = NOW()
            WHERE user_id = 190 AND webhook_id = 120 AND status = 'active'
        """)

        if cur.rowcount > 0:
            print(f"   ✓ Updated strategy_purchase to use webhook 117")
        else:
            print(f"   ℹ️  No purchase updated (may already be correct)")

        # Step 3: Add webhook_subscription for the correct webhook
        print("\n3. ADDING WEBHOOK SUBSCRIPTION:")
        cur.execute("""
            INSERT INTO webhook_subscriptions (
                webhook_id,
                user_id,
                subscribed_at,
                strategy_type,
                strategy_id,
                strategy_code_id
            ) VALUES (
                117,          -- The correct Break N Enter webhook
                190,          -- user_id
                NOW(),        -- subscribed_at
                'hybrid',     -- strategy_type
                NULL,         -- strategy_id
                NULL          -- strategy_code_id
            )
            ON CONFLICT DO NOTHING
        """)

        if cur.rowcount > 0:
            print(f"   ✓ Added webhook_subscription for webhook 117")
        else:
            print(f"   ℹ️  Webhook subscription may already exist")

        # Commit changes
        conn.commit()
        print("\n4. CHANGES COMMITTED SUCCESSFULLY")

        # Step 4: Verify the fix
        print("\n5. VERIFYING THE FIX:")
        cur.execute("""
            SELECT
                ws.webhook_id,
                w.name,
                w.user_id as owner_id,
                u.email as owner_email,
                sp.stripe_subscription_id,
                sp.status
            FROM webhook_subscriptions ws
            JOIN webhooks w ON ws.webhook_id = w.id
            JOIN users u ON w.user_id = u.id
            LEFT JOIN strategy_purchases sp ON sp.user_id = ws.user_id AND sp.webhook_id = ws.webhook_id
            WHERE ws.user_id = 190 AND ws.webhook_id = 117
        """)

        result = cur.fetchone()
        if result:
            print(f"   ✓ User 190 now subscribed to webhook {result[0]} ({result[1]})")
            print(f"   ✓ Owned by user {result[2]} ({result[3]})")
            print(f"   ✓ Stripe subscription: {result[4]}")
            print(f"   ✓ Purchase status: {result[5]}")

        # Step 5: Show all users with the correct Break N Enter
        print("\n6. ALL USERS WITH CORRECT BREAK N ENTER (webhook 117):")
        cur.execute("""
            SELECT
                ws.user_id,
                u.email,
                sp.status
            FROM webhook_subscriptions ws
            JOIN users u ON ws.user_id = u.id
            LEFT JOIN strategy_purchases sp ON sp.user_id = ws.user_id AND sp.webhook_id = ws.webhook_id
            WHERE ws.webhook_id = 117
            ORDER BY ws.user_id
        """)

        users = cur.fetchall()
        for user in users:
            emoji = "✓" if user[0] in [188, 190] else "•"
            print(f"   {emoji} User {user[0]} ({user[1]}) - Purchase: {user[2] or 'N/A'}")

        print("\n" + "=" * 80)
        print("✅ FIX COMPLETED!")
        print("User 190 has been migrated to the correct Break N Enter webhook (117)")
        print("They should now see Break N Enter in their strategy dropdown.")
        print("=" * 80)

    except Exception as e:
        conn.rollback()
        print(f"\n❌ ERROR: {e}")
        print("Transaction rolled back.")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    fix_user_190()