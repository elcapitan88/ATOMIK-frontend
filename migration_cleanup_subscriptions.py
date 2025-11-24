"""
Migration script to clean up subscription data
This will properly categorize users and fix inconsistencies
"""
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

# Database connection
DATABASE_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def cleanup_subscriptions(dry_run=True):
    """
    Clean up subscription data to ensure consistency

    Args:
        dry_run: If True, only show what would be changed without committing
    """
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    print("=" * 80)
    print(f"SUBSCRIPTION DATA CLEANUP {'(DRY RUN)' if dry_run else '(EXECUTING)'}")
    print("=" * 80)

    updates_made = []

    # 1. Fix starter tier users without Stripe - mark as lifetime
    print("\n1. STARTER TIER USERS WITHOUT STRIPE IDS:")
    print("-" * 40)

    cur.execute("""
        SELECT u.id, u.email, s.id as sub_id, s.tier, s.is_lifetime
        FROM users u
        JOIN subscriptions s ON u.id = s.user_id
        WHERE s.tier = 'starter'
        AND s.is_lifetime = false
        AND (s.stripe_customer_id IS NULL OR s.stripe_customer_id = '')
        AND s.status = 'active'
    """)

    starter_users = cur.fetchall()
    print(f"Found {len(starter_users)} starter users to update:")

    for user in starter_users:
        print(f"  User {user['id']}: {user['email']}")
        if not dry_run:
            cur.execute("""
                UPDATE subscriptions
                SET is_lifetime = true,
                    updated_at = NOW()
                WHERE id = %s
            """, (user['sub_id'],))
            updates_made.append(f"Set user {user['id']} to lifetime (starter tier)")

    # 2. Ensure all March 11 users are properly marked as lifetime
    print("\n2. MARCH 11 MIGRATION USERS:")
    print("-" * 40)

    cur.execute("""
        SELECT u.id, u.email, s.id as sub_id, s.tier, s.is_lifetime
        FROM users u
        JOIN subscriptions s ON u.id = s.user_id
        WHERE DATE(s.created_at) = '2025-03-11'
        AND s.is_lifetime = false
        AND s.status = 'active'
    """)

    march_users = cur.fetchall()
    print(f"Found {len(march_users)} March 11 users not marked as lifetime:")

    for user in march_users:
        print(f"  User {user['id']}: {user['email']} (tier: {user['tier']})")
        if not dry_run:
            cur.execute("""
                UPDATE subscriptions
                SET is_lifetime = true,
                    updated_at = NOW()
                WHERE id = %s
            """, (user['sub_id'],))
            updates_made.append(f"Set user {user['id']} to lifetime (March 11 migration)")

    # 3. Fix any null dunning_stage values
    print("\n3. FIX NULL DUNNING_STAGE VALUES:")
    print("-" * 40)

    cur.execute("""
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE dunning_stage IS NULL
    """)

    null_dunning = cur.fetchone()
    print(f"Found {null_dunning['count']} subscriptions with null dunning_stage")

    if null_dunning['count'] > 0 and not dry_run:
        cur.execute("""
            UPDATE subscriptions
            SET dunning_stage = 'none'
            WHERE dunning_stage IS NULL
        """)
        updates_made.append(f"Fixed {null_dunning['count']} null dunning_stage values")

    # 4. Summary
    print("\n" + "=" * 80)
    print("CLEANUP SUMMARY:")
    print("-" * 40)

    if dry_run:
        print("\nDRY RUN COMPLETE - No changes made")
        print(f"Would update {len(starter_users) + len(march_users)} subscriptions")
        print("\nTo execute changes, run with dry_run=False")
    else:
        conn.commit()
        print(f"\nCOMPLETED - {len(updates_made)} updates made:")
        for update in updates_made:
            print(f"  - {update}")

    # Final status check
    print("\nFINAL STATUS CHECK:")
    cur.execute("""
        SELECT
            COUNT(*) FILTER (WHERE is_lifetime = true) as lifetime_count,
            COUNT(*) FILTER (WHERE tier = 'starter') as starter_count,
            COUNT(*) FILTER (WHERE stripe_customer_id IS NULL) as no_stripe_count,
            COUNT(*) as total_active
        FROM subscriptions
        WHERE status = 'active'
    """)

    final_stats = cur.fetchone()
    print(f"  Total active subscriptions: {final_stats['total_active']}")
    print(f"  Lifetime subscriptions: {final_stats['lifetime_count']}")
    print(f"  Starter tier subscriptions: {final_stats['starter_count']}")
    print(f"  Subscriptions without Stripe ID: {final_stats['no_stripe_count']}")

    conn.close()
    print("\n" + "=" * 80)

def main():
    import sys

    print("SUBSCRIPTION DATA CLEANUP TOOL")
    print("=" * 80)

    if len(sys.argv) > 1 and sys.argv[1] == "--execute":
        print("\n[WARNING] This will modify the database!")
        response = input("Are you sure you want to proceed? (yes/no): ")
        if response.lower() == 'yes':
            cleanup_subscriptions(dry_run=False)
        else:
            print("Aborted.")
    else:
        cleanup_subscriptions(dry_run=True)
        print("\n[INFO] To execute the cleanup, run: python migration_cleanup_subscriptions.py --execute")

if __name__ == "__main__":
    main()