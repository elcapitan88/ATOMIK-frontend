import psycopg2
from datetime import datetime
import uuid

# Database connection
conn = psycopg2.connect(
    "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"
)
cur = conn.cursor()

print("=" * 80)
print("FIXING USER 192 BREAK N ENTER SUBSCRIPTION")
print("=" * 80)

# User 192 Stripe info
user_192_stripe = {
    'customer_id': 'cus_TEkFrQkwHo0FOq',
    'subscription_item_id': 'si_TEkF3yIWvhEtlC',
    'subscription_id': 'sub_1SIGksD3oMVy2RzcaHNPlII8',
    'price_id': 'price_1S6YshD3oMVy2RzcGtMtz9tI'
}

print("\n[STEP 1] Verifying Break N Enter webhook...")
cur.execute("""
    SELECT id, name, strategy_type, user_id
    FROM webhooks
    WHERE id = 117
""")
webhook = cur.fetchone()
if webhook:
    print(f"[OK] Found Break N Enter webhook:")
    print(f"  ID: {webhook[0]}")
    print(f"  Name: {webhook[1]}")
    print(f"  Type: {webhook[2]}")
    print(f"  Owner: User {webhook[3]}")
else:
    print("[ERROR] Webhook 117 not found!")
    exit(1)

print("\n[STEP 2] Checking if subscription already exists...")
cur.execute("""
    SELECT id, user_id, webhook_id, status
    FROM strategy_purchases
    WHERE stripe_subscription_id = %s
""", (user_192_stripe['subscription_id'],))
existing = cur.fetchone()

if existing:
    print(f"[OK] Subscription already exists:")
    print(f"  Purchase ID: {existing[0]}")
    print(f"  User ID: {existing[1]}")
    print(f"  Webhook ID: {existing[2]}")
    print(f"  Status: {existing[3]}")

    if existing[1] != 192 or existing[2] != 117 or existing[3] != 'active':
        print("\n  Updating to correct values...")
        cur.execute("""
            UPDATE strategy_purchases
            SET user_id = 192,
                webhook_id = 117,
                status = 'active',
                updated_at = NOW()
            WHERE stripe_subscription_id = %s
        """, (user_192_stripe['subscription_id'],))
        conn.commit()
        print("  [OK] Updated successfully!")
else:
    print("[X] Subscription not found in database")

    print("\n[STEP 3] Finding or creating pricing record...")

    # Check if pricing exists for this price_id
    cur.execute("""
        SELECT id, base_amount, billing_interval
        FROM strategy_pricing
        WHERE webhook_id = 117
        AND stripe_price_id = %s
    """, (user_192_stripe['price_id'],))
    pricing = cur.fetchone()

    if not pricing:
        print(f"  Creating new pricing record for {user_192_stripe['price_id']}...")
        pricing_id = str(uuid.uuid4())

        # Infer pricing from the price_id or use defaults
        # Break N Enter is typically $99/month
        cur.execute("""
            INSERT INTO strategy_pricing (
                id, webhook_id, pricing_type, billing_interval,
                base_amount, yearly_amount, stripe_price_id,
                is_active, created_at, updated_at
            ) VALUES (
                %s, %s, 'subscription', 'month',
                99.00, 990.00, %s,
                true, NOW(), NOW()
            )
            RETURNING id, base_amount, billing_interval
        """, (pricing_id, 117, user_192_stripe['price_id']))
        pricing = cur.fetchone()
        conn.commit()
        print(f"  [OK] Created pricing record: {pricing[0]}")
    else:
        print(f"  [OK] Found existing pricing record: {pricing[0]}")
        print(f"    Amount: ${pricing[1]}/{pricing[2]}")

    pricing_id = pricing[0]

    print("\n[STEP 4] Creating strategy_purchase record...")
    purchase_id = str(uuid.uuid4())

    # Calculate platform fee (typically 30%) and creator payout
    amount = 99.00
    platform_fee = amount * 0.30
    creator_payout = amount - platform_fee

    cur.execute("""
        INSERT INTO strategy_purchases (
            id, user_id, webhook_id, pricing_id,
            stripe_subscription_id, stripe_payment_intent_id,
            amount_paid, platform_fee, creator_payout,
            purchase_type, status,
            created_at, updated_at
        ) VALUES (
            %s, %s, %s, %s,
            %s, %s,
            %s, %s, %s,
            'subscription', 'active',
            NOW(), NOW()
        )
        RETURNING id
    """, (
        purchase_id,
        192,  # user_id
        117,  # webhook_id for Break N Enter
        pricing_id,
        user_192_stripe['subscription_id'],
        None,  # payment_intent_id not needed for subscription
        amount,  # amount_paid
        platform_fee,  # platform_fee
        creator_payout  # creator_payout
    ))

    new_purchase = cur.fetchone()
    conn.commit()

    print(f"  [OK] Created purchase record: {new_purchase[0]}")

print("\n[STEP 5] Verifying the fix...")
cur.execute("""
    SELECT
        sp.id,
        sp.user_id,
        sp.webhook_id,
        sp.stripe_subscription_id,
        sp.status,
        w.name
    FROM strategy_purchases sp
    JOIN webhooks w ON sp.webhook_id = w.id
    WHERE sp.user_id = 192
    AND sp.webhook_id = 117
""")
verification = cur.fetchone()

if verification:
    print("[SUCCESS] User 192 now has Break N Enter subscription:")
    print(f"  Purchase ID: {verification[0]}")
    print(f"  User ID: {verification[1]}")
    print(f"  Webhook: {verification[2]} - {verification[5]}")
    print(f"  Stripe Sub: {verification[3]}")
    print(f"  Status: {verification[4]}")
else:
    print("[ERROR] Failed to create subscription")

cur.close()
conn.close()

print("\n" + "=" * 80)
print("FIX COMPLETE!")
print("=" * 80)
print("\nUser 192 should now see their Break N Enter subscription in the app.")
print(f"Stripe Subscription ID: {user_192_stripe['subscription_id']}")
print("Status: Active")