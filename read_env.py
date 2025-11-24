
import os

def read_env():
    try:
        with open('.env', 'r') as f:
            print(f.read())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    read_env()
