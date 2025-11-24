#!/usr/bin/env python3
"""
Update Break N Enter (BNE) strategy pricing with new Stripe price ID
"""

import psycopg2
from datetime import datetime, timezone

# Database connection
DATABASE_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def update_bne_pricing():
    """Update BNE strategy pricing with new Stripe price ID."""
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    try:
        # Strategy details
        webhook_token = "OGgxOp0wOd60YGb4kc4CEh8oSz2ZCscKVVZtfwbCbHg"  # BNE token
        new_stripe_price_id = "price_1S6YshD3oMVy2RzcGtMtz9tI"  # New price ID
        new_base_amount = 200.00  # Update this to match your Stripe price
        
        print("=" * 60)
        print("Updating Break N Enter Strategy Pricing")
        print("=" * 60)
        
        # 1. First, get the webhook ID
        cursor.execute("""
            SELECT id, name, user_id
            FROM webhooks 
            WHERE token = %s
        """, (webhook_token,))
        
        webhook_result = cursor.fetchone()
        
        if not webhook_result:
            print(f"ERROR: Webhook not found for token {webhook_token}")
            return
        
        webhook_id, webhook_name, webhook_owner_id = webhook_result
        print(f"Found webhook: ID {webhook_id}, Name: {webhook_name}")
        
        # 2. Check current pricing
        cursor.execute("""
            SELECT id, base_amount, stripe_price_id, stripe_yearly_price_id, pricing_type
            FROM strategy_pricing
            WHERE webhook_id = %s AND is_active = true
        """, (webhook_id,))
        
        current_pricing = cursor.fetchone()
        
        if current_pricing:
            pricing_id, current_amount, current_stripe_id, current_yearly_id, pricing_type = current_pricing
            print(f"\nCurrent pricing:")
            print(f"  - ID: {pricing_id}")
            print(f"  - Base Amount: ${current_amount if current_amount else 'Not set'}")
            print(f"  - Current Stripe Price ID: {current_stripe_id}")
            print(f"  - Yearly Price ID: {current_yearly_id if current_yearly_id else 'Not set'}")
            print(f"  - Type: {pricing_type}")
            
            # 3. Update the pricing
            cursor.execute("""
                UPDATE strategy_pricing
                SET 
                    stripe_price_id = %s,
                    base_amount = %s,
                    updated_at = %s
                WHERE webhook_id = %s AND is_active = true
            """, (new_stripe_price_id, new_base_amount, datetime.now(timezone.utc), webhook_id))
            
            print(f"\nUpdating pricing:")
            print(f"  - New Stripe Price ID: {new_stripe_price_id}")
            print(f"  - New Base Amount: ${new_base_amount}")
            
        else:
            print("\nNo active pricing found. Would you like to create new pricing? (This shouldn't happen for BNE)")
            return
        
        # 4. Verify the update
        cursor.execute("""
            SELECT base_amount, stripe_price_id, updated_at
            FROM strategy_pricing
            WHERE webhook_id = %s AND is_active = true
        """, (webhook_id,))
        
        updated_pricing = cursor.fetchone()
        if updated_pricing:
            new_amount, new_price_id, updated_at = updated_pricing
            print(f"\nVerification - Pricing Updated Successfully:")
            print(f"  - Base Amount: ${new_amount}")
            print(f"  - Stripe Price ID: {new_price_id}")
            print(f"  - Updated At: {updated_at}")
        
        # 5. Check how many active subscriptions exist
        cursor.execute("""
            SELECT COUNT(*) 
            FROM strategy_purchases
            WHERE webhook_id = %s AND status = 'COMPLETED'
        """, (webhook_id,))
        
        active_count = cursor.fetchone()[0]
        print(f"\nActive subscriptions: {active_count}")
        print("Note: Existing subscriptions will continue at their current price.")
        print("Only new subscriptions will use the updated price.")
        
        # Commit the changes
        conn.commit()
        print("\n" + "=" * 60)
        print("SUCCESS: BNE strategy pricing has been updated!")
        print("New checkout sessions will now use price ID:")
        print(f"  {new_stripe_price_id}")
        print("=" * 60)
        
    except Exception as e:
        conn.rollback()
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    update_bne_pricing()