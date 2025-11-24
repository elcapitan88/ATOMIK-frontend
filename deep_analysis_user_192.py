import psycopg2
from datetime import datetime
import json

# Database connection
conn = psycopg2.connect(
    "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"
)
cur = conn.cursor()

print("=" * 80)
print("DEEP ANALYSIS: WHY USER 192 CAN'T ACCESS BREAK N ENTER")
print("=" * 80)

user_id = 192
webhook_id = 117  # Break N Enter

# 1. Check activated_strategies table
print("\n[1] ACTIVATED STRATEGIES FOR USER 192:")
print("-" * 40)
cur.execute("""
    SELECT
        id,
        user_id,
        webhook_id,
        strategy_code,
        status,
        created_at
    FROM activated_strategies
    WHERE user_id = %s
    ORDER BY created_at DESC
""", (user_id,))
activated = cur.fetchall()
print(f"  Found {len(activated)} activated strategies:")
for act in activated:
    print(f"\n  ID: {act[0]}")
    print(f"    Webhook ID: {act[2]}")
    print(f"    Strategy Code: {act[3]}")
    print(f"    Status: {act[4]}")
    print(f"    Created: {act[5]}")

# 2. Check if Break N Enter is in activated_strategies
print("\n[2] BREAK N ENTER IN ACTIVATED_STRATEGIES?")
print("-" * 40)
cur.execute("""
    SELECT COUNT(*)
    FROM activated_strategies
    WHERE user_id = %s
    AND webhook_id = %s
""", (user_id, webhook_id))
has_activated = cur.fetchone()[0]
print(f"  Break N Enter activated for user 192: {'YES' if has_activated else 'NO - THIS IS LIKELY THE ISSUE!'}")

# 3. Check strategy_codes table for Break N Enter
print("\n[3] STRATEGY_CODES TABLE:")
print("-" * 40)
cur.execute("""
    SELECT
        id,
        webhook_id,
        code,
        name,
        is_active,
        created_at
    FROM strategy_codes
    WHERE webhook_id = %s
    OR name LIKE '%Break%Enter%'
    ORDER BY created_at DESC
""", (webhook_id,))
codes = cur.fetchall()
print(f"  Found {len(codes)} strategy codes for Break N Enter:")
for code in codes:
    print(f"\n  ID: {code[0]}")
    print(f"    Webhook ID: {code[1]}")
    print(f"    Code: {code[2]}")
    print(f"    Name: {code[3]}")
    print(f"    Active: {code[4]}")
    print(f"    Created: {code[5]}")

# 4. Check webhook_subscriptions table
print("\n[4] WEBHOOK_SUBSCRIPTIONS TABLE:")
print("-" * 40)
cur.execute("""
    SELECT
        id,
        user_id,
        webhook_id,
        subscription_status,
        created_at
    FROM webhook_subscriptions
    WHERE user_id = %s
    AND webhook_id = %s
""", (user_id, webhook_id))
webhook_subs = cur.fetchall()
print(f"  Found {len(webhook_subs)} webhook_subscriptions for user 192 and Break N Enter:")
for ws in webhook_subs:
    print(f"\n  ID: {ws[0]}")
    print(f"    User ID: {ws[1]}")
    print(f"    Webhook ID: {ws[2]}")
    print(f"    Status: {ws[3]}")
    print(f"    Created: {ws[4]}")

# 5. Check how other working users are set up (e.g., user 190)
print("\n[5] REFERENCE: HOW USER 190 IS SET UP (WORKING USER):")
print("-" * 40)
reference_user = 190

# Check their strategy_purchases
cur.execute("""
    SELECT
        sp.webhook_id,
        sp.status,
        w.name
    FROM strategy_purchases sp
    JOIN webhooks w ON sp.webhook_id = w.id
    WHERE sp.user_id = %s
    AND sp.webhook_id = %s
""", (reference_user, webhook_id))
ref_purchase = cur.fetchone()
if ref_purchase:
    print(f"  User 190 Purchase: Webhook {ref_purchase[0]} - {ref_purchase[2]} (status: {ref_purchase[1]})")

# Check their activated_strategies
cur.execute("""
    SELECT
        webhook_id,
        strategy_code,
        status
    FROM activated_strategies
    WHERE user_id = %s
    AND webhook_id = %s
""", (reference_user, webhook_id))
ref_activated = cur.fetchone()
if ref_activated:
    print(f"  User 190 Activated: Webhook {ref_activated[0]} - Code: {ref_activated[1]} (status: {ref_activated[2]})")
else:
    print(f"  User 190 has NO activated_strategies entry for Break N Enter")

# Check their webhook_subscriptions
cur.execute("""
    SELECT
        webhook_id,
        subscription_status
    FROM webhook_subscriptions
    WHERE user_id = %s
    AND webhook_id = %s
""", (reference_user, webhook_id))
ref_webhook_sub = cur.fetchone()
if ref_webhook_sub:
    print(f"  User 190 Webhook Sub: Webhook {ref_webhook_sub[0]} (status: {ref_webhook_sub[1]})")
else:
    print(f"  User 190 has NO webhook_subscriptions entry")

# 6. Check what the frontend might be querying
print("\n[6] WHAT FRONTEND LIKELY CHECKS:")
print("-" * 40)
print("  Common patterns for checking user subscriptions:")
print("  1. strategy_purchases with status='active' [WE HAVE THIS]")
print("  2. activated_strategies entry [WE DON'T HAVE THIS]")
print("  3. webhook_subscriptions entry [CHECK NEEDED]")
print("  4. Strategy code in strategy_codes table [CHECK NEEDED]")

# 7. Check if there's a specific strategy code needed
print("\n[7] FINDING CORRECT STRATEGY CODE:")
print("-" * 40)

# First check if there's a standard code for Break N Enter
cur.execute("""
    SELECT DISTINCT strategy_code
    FROM activated_strategies
    WHERE webhook_id = %s
    LIMIT 5
""", (webhook_id,))
used_codes = cur.fetchall()
print(f"  Strategy codes used with Break N Enter webhook:")
for code in used_codes:
    print(f"    - {code[0]}")

# Check if there's a specific pattern
cur.execute("""
    SELECT
        u.id,
        u.username,
        acs.strategy_code
    FROM activated_strategies acs
    JOIN users u ON acs.user_id = u.id
    WHERE acs.webhook_id = %s
    ORDER BY acs.created_at DESC
    LIMIT 5
""", (webhook_id,))
recent_activations = cur.fetchall()
print(f"\n  Recent Break N Enter activations:")
for act in recent_activations:
    print(f"    User {act[0]} ({act[1]}): {act[2]}")

print("\n" + "=" * 80)
print("DIAGNOSIS:")
print("=" * 80)

issues = []
if not has_activated:
    issues.append("Missing activated_strategies entry for user 192")

if len(webhook_subs) == 0:
    issues.append("Missing webhook_subscriptions entry for user 192")

if len(issues) > 0:
    print("\nISSUES FOUND:")
    for i, issue in enumerate(issues, 1):
        print(f"  {i}. {issue}")

    print("\nRECOMMENDED FIXES:")
    print("  1. Create activated_strategies entry with appropriate strategy_code")
    print("  2. Create webhook_subscriptions entry if needed")
    print("  3. Ensure strategy_code exists in strategy_codes table")
else:
    print("\nNo obvious issues found in database structure.")
    print("The problem might be in the frontend code or API endpoints.")

cur.close()
conn.close()