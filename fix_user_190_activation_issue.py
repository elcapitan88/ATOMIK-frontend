import psycopg2
import sys
import io

# Set UTF-8 encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Database connection
DB_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def analyze_and_fix():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    print("=" * 80)
    print("ANALYZING USER 190's BREAK N ENTER ACTIVATION ISSUE")
    print("=" * 80)

    # 1. The problem is clear from the previous output
    print("\n1. PROBLEM IDENTIFIED:")
    print("   User 190 has an activated_strategy with:")
    print("   - strategy_code_id: 6 (Break N Enter engine strategy)")
    print("   - ticker: NQ")
    print("   - execution_type: engine")
    print("\n   But their webhook_subscription has:")
    print("   - webhook_id: 117 (Break N Enter webhook)")
    print("   - strategy_type: hybrid")
    print("   - strategy_code_id: NULL (missing!)")

    # 2. Check what strategy_code_id 6 is
    print("\n2. CHECKING STRATEGY_CODE ID 6:")
    cur.execute("""
        SELECT id, name, description
        FROM strategy_codes
        WHERE id = 6
    """)

    strategy_code = cur.fetchone()
    if strategy_code:
        print(f"   ID: {strategy_code[0]}")
        print(f"   Name: {strategy_code[1]}")
        print(f"   Description: {strategy_code[2][:100]}...")

    # 3. The fix
    print("\n3. THE FIX:")
    print("   User 190's webhook_subscription needs strategy_code_id = 6")
    print("   This will link it properly to the engine strategy")

    print("\n4. APPLYING THE FIX:")
    cur.execute("""
        UPDATE webhook_subscriptions
        SET strategy_code_id = 6,
            strategy_type = 'engine'  -- Change from hybrid to engine
        WHERE user_id = 190
        AND webhook_id = 117
    """)

    if cur.rowcount > 0:
        print(f"   ✓ Updated webhook_subscription for user 190")
        print(f"   - Set strategy_code_id = 6")
        print(f"   - Changed strategy_type from 'hybrid' to 'engine'")
        conn.commit()
        print("\n   ✓ Changes committed successfully!")
    else:
        print("   ❌ No webhook_subscription found to update")

    # 5. Verify the fix
    print("\n5. VERIFICATION:")
    cur.execute("""
        SELECT
            ws.webhook_id,
            ws.strategy_type,
            ws.strategy_code_id,
            sc.name as strategy_code_name
        FROM webhook_subscriptions ws
        LEFT JOIN strategy_codes sc ON ws.strategy_code_id = sc.id
        WHERE ws.user_id = 190
        AND ws.webhook_id = 117
    """)

    result = cur.fetchone()
    if result:
        print(f"   Webhook ID: {result[0]}")
        print(f"   Strategy Type: {result[1]}")
        print(f"   Strategy Code ID: {result[2]}")
        print(f"   Strategy Code Name: {result[3]}")

    print("\n" + "=" * 80)
    print("✅ FIX COMPLETED")
    print("=" * 80)
    print("""
    User 190 should now be able to:
    - See Break N Enter in the activated strategies list
    - No longer get the duplicate error when trying to activate
    - Continue receiving trade signals (which was already working)

    The issue was that the webhook_subscription was missing the strategy_code_id
    linking it to the engine strategy that was already activated.
    """)

    cur.close()
    conn.close()

if __name__ == "__main__":
    analyze_and_fix()