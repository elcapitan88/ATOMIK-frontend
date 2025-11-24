import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.join(os.getcwd(), 'fastapi_backend'))

# Manually define the database URL
DATABASE_URL = "postgresql://postgres:K2Q71c2OIVd1ZIXm8Ad1BFk5jF03Kj33@metro.proxy.rlwy.net:47089/railway"

def check_monetization():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Query for the SWTCH webhook
        result = db.execute(text("SELECT id, name, is_monetized, usage_intent, user_id FROM webhooks WHERE id = 156"))
        webhook = result.fetchone()

        if webhook:
            print(f"Webhook ID: {webhook.id}")
            print(f"Name: {webhook.name}")
            print(f"Is Monetized: {webhook.is_monetized}")
            print(f"Usage Intent: {webhook.usage_intent}")
            print(f"Owner ID: {webhook.user_id}")
            
            # Check for pricing
            pricing_result = db.execute(text("SELECT * FROM strategy_pricing WHERE webhook_id = 156"))
            pricing = pricing_result.fetchone()
            if pricing:
                print("Pricing found:")
                print(pricing)
            else:
                print("No pricing configuration found.")
                
        else:
            print("Webhook ID 156 not found.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_monetization()
