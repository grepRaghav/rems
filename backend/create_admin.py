#!/usr/bin/env python
"""
REMS - Administrator Account Creation Utility
Usage:
    python create_admin.py <username> <password> <full_name>
Example:
    python create_admin.py superadmin pass123 "System Director"
"""
import sys
import getpass
from auth import create_user
from db import get_db_status

def main():
    status = get_db_status()
    print("=" * 60)
    print(" Renewable Energy Management System - Admin Creation")
    print(f" Database Target: {status['engine']} ({status['driver_name']})")
    print("=" * 60)

    if len(sys.argv) >= 4:
        username = sys.argv[1].strip()
        password = sys.argv[2]
        full_name = sys.argv[3].strip()
    else:
        print("\nInteractive Admin Creation:")
        username = input("Enter admin username: ").strip()
        if not username:
            print("Username cannot be empty.")
            return
        password = getpass.getpass("Enter admin password: ")
        if not password or len(password) < 4:
            print("Password must be at least 4 characters.")
            return
        full_name = input("Enter admin full name: ").strip() or "System Administrator"

    try:
        user = create_user(username, password, full_name, role="admin")
        print(f"\n[SUCCESS] Administrator created successfully!")
        print(f"  User ID   : {user['user_id']}")
        print(f"  Username  : {user['username']}")
        print(f"  Full Name : {user['full_name']}")
        print(f"  Role      : {user['role']}")
        print(f"  Security  : Password hashed using Werkzeug pbkdf2:sha256")
    except Exception as e:
        print(f"\n[ERROR] Failed to create administrator: {e}")

if __name__ == "__main__":
    main()
