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
        print("--- Checking Webhook 156 ---")
        # Query for the SWTCH webhook
        result = db.execute(text("SELECT id, name, is_monetized, usage_intent, user_id FROM webhooks WHERE id = 156"))
        webhook = result.fetchone()

        if webhook:
            print(f"Webhook ID: {webhook.id}")
            print(f"Name: {webhook.name}")
            print(f"Is Monetized: {webhook.is_monetized}")
            print(f"Usage Intent: {webhook.usage_intent}")
            
            print("\n--- Checking StrategyPricing (New Model) ---")
            pricing_result = db.execute(text("SELECT * FROM strategy_pricing WHERE webhook_id = 156"))
            pricing = pricing_result.fetchone()
            if pricing:
                print("StrategyPricing found:")
                print(pricing)
            else:
                print("No StrategyPricing found.")

            print("\n--- Checking StrategyMonetization (Old Model) ---")
            monetization_result = db.execute(text("SELECT * FROM strategy_monetization WHERE webhook_id = 156"))
            monetization = monetization_result.fetchone()
            if monetization:
                print("StrategyMonetization found:")
                print(monetization)
            else:
                print("No StrategyMonetization found.")
                
        else:
            print("Webhook ID 156 not found.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_monetization()
