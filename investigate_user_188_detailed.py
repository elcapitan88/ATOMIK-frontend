import psycopg2
import json
from datetime import datetime

# Database connection
DB_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def investigate():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    print("=" * 80)
    print("INVESTIGATING USER 188 - BREAK N ENTER SUBSCRIPTION")
    print("Stripe Customer ID: cus_TBOdt5YUCM8yFd")
    print("Stripe Subscription ID: sub_1SF1pyD3oMVy2RzcxMz5WaBQ")
    print("Stripe Item ID: si_TBOdbiFuZI8gn9")
    print("=" * 80)

    # 1. Check user 188
    print("\n1. USER 188 DETAILS:")
    cur.execute("""
        SELECT id, email, created_at, updated_at
        FROM users
        WHERE id = 188
    """)
    user = cur.fetchone()
    if user:
        print(f"   User ID: {user[0]}")
        print(f"   Email: {user[1]}")
        print(f"   Created: {user[2]}")

    # 2. Check subscriptions table (not user_subscriptions)
    print("\n2. CHECKING SUBSCRIPTIONS TABLE:")
    cur.execute("""
        SELECT * FROM subscriptions
        WHERE user_id = 188
    """)
    subs = cur.fetchall()
    if subs:
        # Get column names
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'subscriptions'
            ORDER BY ordinal_position
        """)
        cols = [col[0] for col in cur.fetchall()]
        print(f"   Columns: {cols}")
        for sub in subs:
            print(f"   Subscription: {dict(zip(cols, sub))}")
    else:
        print("   No subscriptions found for user 188")

    # 3. Check for any Stripe subscription with the given ID
    print("\n3. SEARCHING FOR STRIPE SUBSCRIPTION ID IN SUBSCRIPTIONS:")
    cur.execute("""
        SELECT * FROM subscriptions
        WHERE stripe_subscription_id = %s OR stripe_customer_id = %s
    """, ('sub_1SF1pyD3oMVy2RzcxMz5WaBQ', 'cus_TBOdt5YUCM8yFd'))
    stripe_subs = cur.fetchall()
    if stripe_subs:
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'subscriptions'
            ORDER BY ordinal_position
        """)
        cols = [col[0] for col in cur.fetchall()]
        for sub in stripe_subs:
            print(f"   Found subscription: {dict(zip(cols, sub))}")
    else:
        print("   No subscription found with given Stripe IDs")

    # 4. Check strategy_codes table for Break N Enter
    print("\n4. CHECKING STRATEGY_CODES TABLE FOR BREAK N ENTER:")
    cur.execute("""
        SELECT * FROM strategy_codes
        WHERE LOWER(name) LIKE '%break%' OR LOWER(name) LIKE '%enter%'
    """)
    strategies = cur.fetchall()
    if strategies:
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'strategy_codes'
            ORDER BY ordinal_position
        """)
        cols = [col[0] for col in cur.fetchall()]
        for strategy in strategies:
            print(f"   Strategy: {dict(zip(cols, strategy))}")
    else:
        print("   No Break N Enter strategy found in strategy_codes")

    # 5. Check strategy_purchases for user 188
    print("\n5. CHECKING STRATEGY_PURCHASES FOR USER 188:")
    cur.execute("""
        SELECT * FROM strategy_purchases
        WHERE user_id = 188
    """)
    purchases = cur.fetchall()
    if purchases:
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'strategy_purchases'
            ORDER BY ordinal_position
        """)
        cols = [col[0] for col in cur.fetchall()]
        for purchase in purchases:
            print(f"   Purchase: {dict(zip(cols, purchase))}")
    else:
        print("   No strategy purchases found for user 188")

    # 6. Check activated_strategies for user 188
    print("\n6. CHECKING ACTIVATED_STRATEGIES FOR USER 188:")
    cur.execute("""
        SELECT * FROM activated_strategies
        WHERE user_id = 188
    """)
    activated = cur.fetchall()
    if activated:
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'activated_strategies'
            ORDER BY ordinal_position
        """)
        cols = [col[0] for col in cur.fetchall()]
        for act in activated:
            print(f"   Activated: {dict(zip(cols, act))}")
    else:
        print("   No activated strategies for user 188")

    # 7. Check webhook_subscriptions
    print("\n7. CHECKING WEBHOOK_SUBSCRIPTIONS:")
    cur.execute("""
        SELECT * FROM webhook_subscriptions
        WHERE stripe_subscription_id = %s
    """, ('sub_1SF1pyD3oMVy2RzcxMz5WaBQ',))
    webhook_subs = cur.fetchall()
    if webhook_subs:
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'webhook_subscriptions'
            ORDER BY ordinal_position
        """)
        cols = [col[0] for col in cur.fetchall()]
        for ws in webhook_subs:
            print(f"   Webhook subscription: {dict(zip(cols, ws))}")
    else:
        print("   No webhook subscription found")

    cur.close()
    conn.close()

if __name__ == "__main__":
    investigate()