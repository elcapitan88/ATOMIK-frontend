import psycopg2
import sys
import io

# Set UTF-8 encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Database connection
DB_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def list_completed_users():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    print("=" * 80)
    print("11 USERS WITH 'COMPLETED' STATUS FOR BREAK N ENTER")
    print("=" * 80)

    # List users with COMPLETED status
    cur.execute("""
        SELECT
            sp.user_id,
            u.email,
            sp.stripe_subscription_id,
            sp.amount_paid,
            sp.created_at,
            sp.cancelled_at
        FROM strategy_purchases sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.webhook_id = 117
        AND sp.status = 'COMPLETED'
        ORDER BY sp.user_id
    """)

    completed_users = cur.fetchall()

    print(f"\nTotal users with COMPLETED status: {len(completed_users)}\n")

    for i, user in enumerate(completed_users, 1):
        print(f"{i}. User {user[0]}: {user[1]}")
        print(f"   Stripe: {user[2]}")
        print(f"   Paid: ${user[3]}")
        print(f"   Date: {user[4]}")
        if user[5]:
            print(f"   ⚠️ CANCELLED: {user[5]}")
        print()

    # Also check users with 'active' status for comparison
    print("\n" + "=" * 80)
    print("USERS WITH 'active' STATUS (currently working)")
    print("=" * 80)

    cur.execute("""
        SELECT
            sp.user_id,
            u.email,
            sp.stripe_subscription_id,
            sp.amount_paid,
            sp.created_at
        FROM strategy_purchases sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.webhook_id = 117
        AND sp.status = 'active'
        ORDER BY sp.user_id
    """)

    active_users = cur.fetchall()

    print(f"\nTotal users with active status: {len(active_users)}\n")

    for i, user in enumerate(active_users, 1):
        print(f"{i}. User {user[0]}: {user[1]}")
        print(f"   Stripe: {user[2]}")
        print(f"   Paid: ${user[3]}")
        print(f"   Date: {user[4]}")
        print()

    cur.close()
    conn.close()

if __name__ == "__main__":
    list_completed_users()