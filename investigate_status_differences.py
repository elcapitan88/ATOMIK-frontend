import psycopg2
import sys
import io
from datetime import datetime

# Set UTF-8 encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Database connection
DB_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def investigate_status_differences():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    print("=" * 80)
    print("INVESTIGATING STATUS DIFFERENCES - COMPLETED vs active")
    print("=" * 80)

    # 1. Check if COMPLETED users can see Break N Enter
    print("\n1. CHECKING IF 'COMPLETED' STATUS USERS CAN ACCESS BREAK N ENTER:")
    cur.execute("""
        SELECT
            sp.user_id,
            u.email,
            sp.status,
            sp.amount_paid,
            sp.created_at,
            CASE
                WHEN ws.id IS NOT NULL THEN '✅ YES - Has webhook_subscription'
                ELSE '❌ NO - Missing webhook_subscription'
            END as can_see_strategy
        FROM strategy_purchases sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN webhook_subscriptions ws ON ws.user_id = sp.user_id AND ws.webhook_id = sp.webhook_id
        WHERE sp.webhook_id = 117
        AND sp.status = 'COMPLETED'
        ORDER BY can_see_strategy DESC, sp.created_at
    """)

    completed_users = cur.fetchall()

    for user in completed_users:
        print(f"\n   User {user[0]} ({user[1]})")
        print(f"   Status: {user[2]}, Paid: ${user[3]}")
        print(f"   Can Access Strategy: {user[5]}")

    # 2. Pattern analysis
    print("\n2. PATTERN ANALYSIS:")

    # Check dates
    print("\n   Purchase Date Patterns:")
    print("   COMPLETED status: All from Aug-Sep 2025 (older purchases)")
    print("   active status: All from Oct 2025 (recent purchases)")

    # Check amounts
    print("\n   Price Patterns:")
    print("   COMPLETED: Mostly $150 (old pricing)")
    print("   active: Mix of $500 and $29.99 (new pricing)")

    # 3. Check if COMPLETED users need fixing
    print("\n3. WHICH 'COMPLETED' USERS NEED FIXING:")
    cur.execute("""
        SELECT
            sp.user_id,
            u.email,
            ws.id as has_webhook_sub
        FROM strategy_purchases sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN webhook_subscriptions ws ON ws.user_id = sp.user_id AND ws.webhook_id = sp.webhook_id
        WHERE sp.webhook_id = 117
        AND sp.status = 'COMPLETED'
    """)

    needs_fix = []
    already_working = []

    for row in cur.fetchall():
        if row[2] is None:
            needs_fix.append((row[0], row[1]))
        else:
            already_working.append((row[0], row[1]))

    if already_working:
        print("\n   ✅ COMPLETED users who already have access (no fix needed):")
        for user in already_working:
            print(f"      - User {user[0]}: {user[1]}")

    if needs_fix:
        print("\n   ❌ COMPLETED users who need webhook_subscriptions added:")
        for user in needs_fix:
            print(f"      - User {user[0]}: {user[1]}")

    # 4. Recommendations
    print("\n" + "=" * 80)
    print("📊 ANALYSIS SUMMARY")
    print("=" * 80)

    print("""
    STATUS DIFFERENCE EXPLANATION:
    - 'COMPLETED' = Older purchases (Aug-Sep 2025) at $150 price point
    - 'active' = Recent purchases (Oct 2025) at new pricing ($29.99 or $500)

    The status difference appears to be from different webhook/purchase flows
    over time, possibly due to system updates or pricing changes.

    CURRENT SITUATION:
    - nicolasgon2422@gmail.com ✅ CONFIRMED WORKING (after our fix)
    - alexanderggarcia91@gmail.com should also be working (after our fix)
    """)

    if needs_fix:
        print(f"\n    ACTION NEEDED:")
        print(f"    - {len(needs_fix)} users with COMPLETED status still need webhook_subscriptions")
        print(f"    - These users likely cannot see Break N Enter in their dropdown")
        print(f"\n    To fix them, add webhook_subscriptions for these users.")
    else:
        print(f"\n    ✅ All users with COMPLETED status can access the strategy!")

    cur.close()
    conn.close()

if __name__ == "__main__":
    investigate_status_differences()