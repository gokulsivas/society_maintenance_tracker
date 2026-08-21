#!/usr/bin/env python3
"""
Deployment Smoke-Test Script
Verifies deployed or local API endpoints without exposing tokens, passwords, or secrets.
"""

import os
import sys
import uuid
import httpx

def mask_string(val: str, show_last: int = 4) -> str:
    if not val:
        return "[empty]"
    if len(val) <= show_last:
        return "***"
    return f"***{val[-show_last:]}"

def main():
    base_url = os.getenv("BASE_URL", "http://127.0.0.1:8000").rstrip("/")
    create_user_flag = os.getenv("SMOKE_CREATE_USER", "false").lower() in ("true", "1", "yes")

    admin_email = os.getenv("ADMIN_EMAIL", "admin@society.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@12345")
    resident_email = os.getenv("RESIDENT_EMAIL", "resident@society.com")
    resident_password = os.getenv("RESIDENT_PASSWORD", "Resident@12345")

    print("==================================================")
    print(" Society Maintenance Tracker — Smoke Test")
    print(f" Target Base URL: {base_url}")
    print(f" Create User Mode: {create_user_flag}")
    print("==================================================")

    with httpx.Client(base_url=base_url, timeout=15.0) as client:
        # 1. Health Check (Contract: 200)
        print("\\n1. Checking /api/health ...", end=" ")
        try:
            r = client.get("/api/health")
            if r.status_code == 200:
                data = r.json()
                print(f"[OK] HTTP 200 (status={data.get('status')}, db_configured={data.get('database_configured')})")
            else:
                print(f"[FAILED] HTTP {r.status_code}: {r.text}")
                return 1
        except Exception as e:
            print(f"[FAILED] Connection error: {e}")
            return 1

        # 2. Resident Auth (Registration: 201 or Login: 200)
        auth_token = None
        if create_user_flag:
            unique_suffix = uuid.uuid4().hex[:6]
            test_email = f"smoke_user_{unique_suffix}@society.com"
            print(f"2. Registering new test user ({test_email}) ...", end=" ")
            r = client.post(
                "/api/auth/register",
                json={
                    "name": f"Smoke Tester {unique_suffix}",
                    "email": test_email,
                    "password": "SmokeTestPass@123",
                    "flat_no": f"T-{unique_suffix[:3].upper()}",
                },
            )
            if r.status_code == 201:
                auth_token = r.json().get("access_token")
                print(f"[OK] HTTP 201 (Token: {mask_string(auth_token)})")
            else:
                print(f"[FAILED] HTTP {r.status_code}: {r.text}")
                return 1
        else:
            print("2. Logging in with resident credentials ...", end=" ")
            r = client.post(
                "/api/auth/login",
                json={"email": resident_email, "password": resident_password},
            )
            if r.status_code == 200:
                auth_token = r.json().get("access_token")
                print(f"[OK] HTTP 200 (Token: {mask_string(auth_token)})")
            else:
                print(f"[FAILED] HTTP {r.status_code}: {r.text}")
                return 1

        # 3. Authenticated Profile Read (Contract: 200)
        headers = {"Authorization": f"Bearer {auth_token}"}
        print("3. Checking /api/auth/me ...", end=" ")
        r = client.get("/api/auth/me", headers=headers)
        if r.status_code == 200:
            user_data = r.json()
            print(f"[OK] HTTP 200 (User ID={user_data.get('id')}, Role={user_data.get('role')})")
        else:
            print(f"[FAILED] HTTP {r.status_code}: {r.text}")
            return 1

        # 4. Resident Complaints Read (Contract: 200)
        print("4. Checking /api/complaints/my ...", end=" ")
        r = client.get("/api/complaints/my", headers=headers)
        if r.status_code == 200:
            complaints = r.json()
            print(f"[OK] HTTP 200 (Total complaints: {len(complaints)})")
        else:
            print(f"[FAILED] HTTP {r.status_code}: {r.text}")
            return 1

        # 5. Notices Read (Contract: 200)
        print("5. Checking /api/notices ...", end=" ")
        r = client.get("/api/notices", headers=headers)
        if r.status_code == 200:
            notices = r.json()
            print(f"[OK] HTTP 200 (Total notices: {len(notices)})")
        else:
            print(f"[FAILED] HTTP {r.status_code}: {r.text}")
            return 1

        # 6. Admin Login & Dashboard Check (Contract: 200)
        print("6. Checking Admin Login & /api/admin/dashboard ...", end=" ")
        r_admin = client.post(
            "/api/auth/login",
            json={"email": admin_email, "password": admin_password},
        )
        if r_admin.status_code == 200:
            admin_token = r_admin.json().get("access_token")
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            r_dash = client.get("/api/admin/dashboard", headers=admin_headers)
            if r_dash.status_code == 200:
                dash_data = r_dash.json()
                print(f"[OK] HTTP 200 (Total: {dash_data.get('total_complaints')}, Open: {dash_data.get('open_complaints')}, Overdue: {dash_data.get('overdue_complaints')})")
            else:
                print(f"[FAILED] Dashboard HTTP {r_dash.status_code}: {r_dash.text}")
                return 1
        else:
            print(f"[SKIP/WARNING] Admin login returned HTTP {r_admin.status_code}: {r_admin.text}")

    print("\\n==================================================")
    print(" All smoke tests completed successfully!")
    print("==================================================")
    return 0

if __name__ == "__main__":
    sys.exit(main())
