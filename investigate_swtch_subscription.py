
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add fastapi_backend to path
sys.path.append(os.path.join(os.getcwd(), 'fastapi_backend'))

# Import models directly (assuming they don't import settings)
from app.models.user import User
from app.models.webhook import Webhook, WebhookSubscription
from app.models.strategy_code import StrategyCode
from app.models.strategy_purchase import StrategyPurchase
from app.models.aria_context import UserTradingProfile
from app.models.broker import BrokerAccount
from app.models.subscription import Subscription
from app.models.order import Order
from app.models.trade import Trade
from app.models.affiliate import Affiliate
from app.models.creator_profile import CreatorProfile

# Manual DB URL from .env (DEV public URL)
DATABASE_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def investigate():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Define the user ID and strategy name to investigate
        USER_ID = 161 # Moved USER_ID definition here to be used by the initial investigation
        STRATEGY_NAME = "SWTCH"

        print(f"--- Investigating User {USER_ID} ---")
        user = db.query(User).filter(User.id == USER_ID).first()
        if user:
            print(f"User found: {user.username} (ID: {user.id})")
        else:
            print(f"User {USER_ID} not found!")
            return

        print("\n--- Searching for 'SWTCH' Strategy ---")
        # Search in Webhooks
        webhooks = db.query(Webhook).filter(Webhook.name.ilike('%SWTCH%')).all()
        print(f"Found {len(webhooks)} Webhooks matching 'SWTCH':")
        for w in webhooks:
            print(f"  - Webhook ID: {w.id}, Name: {w.name}, Owner ID: {w.user_id}, Token: {w.token}, Type: {w.strategy_type}")
            print(f"    -> Monetized: {w.is_monetized}, Stripe Product ID: {w.stripe_product_id}, Usage Intent: {w.usage_intent}")
            if w.user_id == 39:
                print("    -> User 39 OWNS this strategy!")

        # Identify other webhooks
        print("\n--- Identifying other webhooks ---")
        for wid in [146, 117]:
            w = db.query(Webhook).filter(Webhook.id == wid).first()
            if w:
                print(f"  - Webhook ID: {w.id}, Name: {w.name}, Owner ID: {w.user_id}")
            else:
                print(f"  - Webhook ID: {wid} NOT FOUND")

        # Define the user ID and strategy name to investigate
        USER_ID = 161
        STRATEGY_NAME = "SWTCH"
        # Search in StrategyCode
        strategies = db.query(StrategyCode).filter(StrategyCode.name.ilike(f'%{STRATEGY_NAME}%')).all()
        print(f"Found {len(strategies)} StrategyCodes matching '{STRATEGY_NAME}':")
        for s in strategies:
            print(f"  - StrategyCode ID: {s.id}, Name: {s.name}, Description: {s.description}")

        print(f"\n--- Checking User {USER_ID} Subscriptions ---")
        subscriptions = db.query(WebhookSubscription).filter(WebhookSubscription.user_id == USER_ID).all()
        print(f"Found {len(subscriptions)} subscriptions for User {USER_ID}:")
        for sub in subscriptions:
            print(f"  - ID: {sub.id}, Type: {sub.strategy_type}, WebhookID: {sub.webhook_id}, StrategyCodeID: {sub.strategy_code_id}, StrategyID: {sub.strategy_id}")

        print("\n--- Checking User 39 Purchases ---")
        purchases = db.query(StrategyPurchase).filter(StrategyPurchase.user_id == 39).all()
        print(f"Found {len(purchases)} purchases for User 39:")
        for p in purchases:
            print(f"  - ID: {p.id}, WebhookID: {p.webhook_id}, Status: {p.status}")

        print("\n--- Checking Global Subscriptions for SWTCH (ID 156) ---")
        swtch_subs = db.query(WebhookSubscription).filter(WebhookSubscription.webhook_id == 156).all()
        print(f"Found {len(swtch_subs)} total subscriptions for SWTCH:")
        for sub in swtch_subs:
            print(f"  - User ID: {sub.user_id}, Sub ID: {sub.id}")


    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    investigate()
