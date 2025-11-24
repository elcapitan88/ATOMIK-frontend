
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Add fastapi_backend to path
sys.path.append(os.path.join(os.getcwd(), 'fastapi_backend'))

# Import models directly
from app.models.user import User
from app.models.webhook import Webhook, WebhookSubscription
from app.models.aria_context import UserTradingProfile
from app.models.broker import BrokerAccount
from app.models.subscription import Subscription
from app.models.order import Order
from app.models.trade import Trade
from app.models.affiliate import Affiliate
from app.models.creator_profile import CreatorProfile

# Manual DB URL from .env (DEV public URL)
DATABASE_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def fix_subscription():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        USER_ID = 161
        WEBHOOK_ID = 156
        
        print(f"--- Fixing User {USER_ID} Subscription to SWTCH (ID {WEBHOOK_ID}) ---")
        
        # 1. Verify User
        user = db.query(User).filter(User.id == USER_ID).first()
        if not user:
            print(f"Error: User {USER_ID} not found!")
            return
        print(f"User verified: {user.username} (ID: {user.id})")

        # 2. Verify Strategy
        webhook = db.query(Webhook).filter(Webhook.id == WEBHOOK_ID).first()
        if not webhook:
            print(f"Error: Webhook {WEBHOOK_ID} (SWTCH) not found!")
            return
        print(f"Strategy verified: {webhook.name} (ID: {webhook.id})")

        # 3. Check for existing subscription
        existing_sub = db.query(WebhookSubscription).filter(
            WebhookSubscription.user_id == USER_ID,
            WebhookSubscription.webhook_id == WEBHOOK_ID
        ).first()

        if existing_sub:
            print(f"Subscription already exists! ID: {existing_sub.id}")
            return

        # 4. Create Subscription
        print("Creating new subscription...")
        new_sub = WebhookSubscription(
            user_id=USER_ID,
            webhook_id=WEBHOOK_ID,
            strategy_type='webhook',
            subscribed_at=datetime.utcnow()
        )
        
        db.add(new_sub)
        db.commit()
        db.refresh(new_sub)
        
        print(f"SUCCESS: Subscription created! ID: {new_sub.id}")
        print(f"User {USER_ID} is now subscribed to {webhook.name}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_subscription()
