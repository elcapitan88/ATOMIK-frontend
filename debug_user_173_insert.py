import psycopg2
import sys
import io
from datetime import datetime
import uuid
from decimal import Decimal

# Set UTF-8 encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Database connection
DB_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def debug_insert():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    try:
        print("DEBUGGING USER 173 INSERT")
        print("=" * 80)

        # Check if purchase already exists
        cur.execute("""
            SELECT id, webhook_id, status
            FROM strategy_purchases
            WHERE user_id = 173
            AND stripe_subscription_id = 'sub_1S96r4D3oMVy2RzcbsMU0O2v'
        """)

        existing = cur.fetchone()
        if existing:
            print(f"⚠️ Purchase already exists!")
            print(f"   ID: {existing[0]}")
            print(f"   Webhook: {existing[1]}")
            print(f"   Status: {existing[2]}")
            return

        # Try the insert with explicit values
        purchase_id = str(uuid.uuid4())
        pricing_id = str(uuid.uuid4())
        price = Decimal('150.00')
        platform_fee = price * Decimal('0.15')
        creator_payout = price * Decimal('0.85')

        print(f"Purchase ID: {purchase_id}")
        print(f"Pricing ID: {pricing_id}")
        print(f"Price: ${price}")
        print(f"Platform Fee: ${platform_fee}")
        print(f"Creator Payout: ${creator_payout}")

        sql = """
            INSERT INTO strategy_purchases (
                id,
                user_id,
                webhook_id,
                pricing_id,
                stripe_payment_intent_id,
                stripe_subscription_id,
                amount_paid,
                platform_fee,
                creator_payout,
                purchase_type,
                status,
                created_at,
                updated_at
            ) VALUES (
                %(id)s,
                %(user_id)s,
                %(webhook_id)s,
                %(pricing_id)s,
                %(payment_intent)s,
                %(subscription_id)s,
                %(amount)s,
                %(fee)s,
                %(payout)s,
                %(type)s,
                %(status)s,
                %(created)s,
                %(updated)s
            )
        """

        params = {
            'id': purchase_id,
            'user_id': 173,
            'webhook_id': 117,
            'pricing_id': pricing_id,
            'payment_intent': None,
            'subscription_id': 'sub_1S96r4D3oMVy2RzcbsMU0O2v',
            'amount': price,
            'fee': platform_fee,
            'payout': creator_payout,
            'type': 'subscription',
            'status': 'active',
            'created': '2025-09-19 12:00:00+00',
            'updated': datetime.now()
        }

        print("\nExecuting INSERT...")
        cur.execute(sql, params)

        if cur.rowcount > 0:
            print("✓ Insert successful!")
            conn.commit()
            print("✓ Committed!")
        else:
            print("❌ No rows inserted")

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    debug_insert()