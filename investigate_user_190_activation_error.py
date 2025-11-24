import psycopg2
import sys
import io
from datetime import datetime

# Set UTF-8 encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Database connection
DB_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def investigate_user_190_error():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    print("=" * 80)
    print("INVESTIGATING USER 190 ACTIVATION ERROR")
    print("User: nicolasgon2422@gmail.com")
    print("=" * 80)

    # 1. Check webhook_subscriptions for user 190
    print("\n1. WEBHOOK_SUBSCRIPTIONS FOR USER 190:")
    cur.execute("""
        SELECT
            ws.*,
            w.name as webhook_name
        FROM webhook_subscriptions ws
        JOIN webhooks w ON ws.webhook_id = w.id
        WHERE ws.user_id = 190
    """)

    cols = ['id', 'webhook_id', 'user_id', 'subscribed_at', 'strategy_type', 'strategy_id', 'strategy_code_id', 'webhook_name']
    webhook_subs = cur.fetchall()

    for sub in webhook_subs:
        sub_dict = dict(zip(cols, sub))
        print(f"\n   Webhook Subscription ID: {sub_dict['id']}")
        print(f"   Webhook: {sub_dict['webhook_name']} (ID: {sub_dict['webhook_id']})")
        print(f"   Strategy Type: {sub_dict['strategy_type']}")
        print(f"   Strategy ID: {sub_dict['strategy_id']}")
        print(f"   Strategy Code ID: {sub_dict['strategy_code_id']}")

    # 2. Check activated_strategies for user 190
    print("\n2. ACTIVATED_STRATEGIES FOR USER 190:")
    cur.execute("""
        SELECT * FROM activated_strategies
        WHERE user_id = 190
    """)

    activated = cur.fetchall()
    if activated:
        # Get column names
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'activated_strategies'
            ORDER BY ordinal_position
        """)
        cols = [col[0] for col in cur.fetchall()]

        for act in activated:
            act_dict = dict(zip(cols, act))
            print(f"\n   Found activated strategy:")
            for key, value in act_dict.items():
                if value is not None:
                    print(f"     {key}: {value}")
    else:
        print("   ❌ No activated strategies found for user 190")

    # 3. Check for duplicate entries or conflicts
    print("\n3. CHECKING FOR DUPLICATES/CONFLICTS:")

    # Check if there's already an activated strategy for webhook 117
    cur.execute("""
        SELECT
            as2.id,
            as2.user_id,
            as2.webhook_id,
            as2.strategy_code_id,
            as2.strategy_name,
            as2.status
        FROM activated_strategies as2
        WHERE as2.user_id = 190
        AND (as2.webhook_id = 117 OR as2.webhook_id = 120)
    """)

    conflicts = cur.fetchall()
    if conflicts:
        print("   ⚠️ Found potential conflicts:")
        for conflict in conflicts:
            print(f"      ID: {conflict[0]}, Webhook: {conflict[2]}, Strategy Code: {conflict[3]}, Status: {conflict[5]}")
    else:
        print("   No conflicts in activated_strategies")

    # 4. Check strategy_type differences
    print("\n4. STRATEGY TYPE ANALYSIS:")

    # Check what strategy_type other Break N Enter users have
    cur.execute("""
        SELECT
            ws.user_id,
            u.email,
            ws.strategy_type,
            CASE
                WHEN as2.id IS NOT NULL THEN 'YES'
                ELSE 'NO'
            END as has_activated_strategy
        FROM webhook_subscriptions ws
        JOIN users u ON ws.user_id = u.id
        LEFT JOIN activated_strategies as2 ON ws.user_id = as2.user_id AND ws.webhook_id = as2.webhook_id
        WHERE ws.webhook_id = 117
        ORDER BY ws.user_id
    """)

    users = cur.fetchall()
    print("\n   Break N Enter users and their strategy_type:")
    for user in users:
        icon = "→" if user[0] == 190 else " "
        print(f"   {icon} User {user[0]} ({user[1]}): Type='{user[2]}', Activated={user[3]}")

    # 5. Check if strategy_code_id should be set
    print("\n5. CHECKING STRATEGY_CODE CONFIGURATION:")
    cur.execute("""
        SELECT id, name, user_id
        FROM strategy_codes
        WHERE LOWER(name) LIKE '%break%enter%'
    """)

    strategy_codes = cur.fetchall()
    if strategy_codes:
        print("   Found strategy_codes for Break N Enter:")
        for code in strategy_codes:
            print(f"      ID: {code[0]}, Name: {code[1]}, Owner: User {code[2]}")

        print("\n   ⚠️ POSSIBLE ISSUE:")
        print("   User 190's webhook_subscription has strategy_type='hybrid' but no strategy_code_id")
        print("   This might be causing the activation error")

    # 6. Generate fix
    print("\n" + "=" * 80)
    print("🔧 RECOMMENDED FIXES")
    print("=" * 80)

    print("""
    ISSUE IDENTIFIED:
    - User 190 is receiving signals (webhook is working)
    - But can't activate/see it in activated strategies
    - Getting "strategy with this strategy code and account already exists" error

    LIKELY CAUSE:
    - The strategy_type is set to 'hybrid' but should probably be 'webhook'
    - OR it needs a strategy_code_id if it's truly an engine strategy

    FIX OPTIONS:

    Option 1: Change strategy_type to 'webhook' (if it's purely webhook-based):
    """)

    print("""
    UPDATE webhook_subscriptions
    SET strategy_type = 'webhook'
    WHERE user_id = 190 AND webhook_id = 117;
    """)

    print("""
    Option 2: Set the correct strategy_code_id (if it's an engine strategy):
    """)

    if strategy_codes:
        print(f"""
    UPDATE webhook_subscriptions
    SET strategy_code_id = {strategy_codes[0][0]}
    WHERE user_id = 190 AND webhook_id = 117;
    """)

    print("""
    Option 3: Add the missing activated_strategies entry:
    """)

    print("""
    INSERT INTO activated_strategies (
        user_id,
        webhook_id,
        strategy_name,
        strategy_type,
        status,
        activated_at,
        created_at,
        updated_at
    ) VALUES (
        190,
        117,
        'Break N Enter',
        'webhook',  -- or 'hybrid' depending on the system
        'active',
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (user_id, webhook_id) DO NOTHING;
    """)

    cur.close()
    conn.close()

if __name__ == "__main__":
    investigate_user_190_error()