import uuid
from functools import wraps
from flask import session, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from db import execute_query, execute_non_query

def hash_password(password: str) -> str:
    """Hashes a password using Werkzeug's secure hashing."""
    return generate_password_hash(password, method='pbkdf2:sha256')

def verify_password(password: str, hashed: str) -> bool:
    """Verifies a plain password against the stored hash."""
    return check_password_hash(hashed, password)

def login_required(f):
    """Decorator to enforce authenticated session on API endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({
                "success": False,
                "error": "Authentication required. Please log in.",
                "code": "UNAUTHORIZED"
            }), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to enforce admin privileges on sensitive API routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get("user_id")
        role = session.get("role")
        if not user_id:
            return jsonify({
                "success": False,
                "error": "Authentication required. Please log in.",
                "code": "UNAUTHORIZED"
            }), 401
        if role != "admin":
            return jsonify({
                "success": False,
                "error": "Forbidden: Administrator role required.",
                "code": "FORBIDDEN"
            }), 403
        return f(*args, **kwargs)
    return decorated_function

def authenticate_user(username, password):
    """Verifies username and password against the APP_USERS table."""
    users = execute_query(
        "SELECT USER_ID, USERNAME, PASSWORD_HASH, FULL_NAME, ROLE FROM APP_USERS WHERE USERNAME = ?",
        [username]
    )
    if not users:
        return None
    user = users[0]
    if verify_password(password, user["PASSWORD_HASH"]):
        return {
            "user_id": user["USER_ID"],
            "username": user["USERNAME"],
            "full_name": user["FULL_NAME"],
            "role": user["ROLE"]
        }
    return None

def create_user(username, password, full_name, role="admin"):
    """Creates a new user record with securely hashed password."""
    user_id = str(uuid.uuid4())
    pw_hash = hash_password(password)
    
    # Check if username exists
    existing = execute_query("SELECT USER_ID FROM APP_USERS WHERE USERNAME = ?", [username])
    if existing:
        raise ValueError(f"Username '{username}' already exists.")
        
    execute_non_query(
        "INSERT INTO APP_USERS (USER_ID, USERNAME, PASSWORD_HASH, FULL_NAME, ROLE) VALUES (?, ?, ?, ?, ?)",
        [user_id, username, pw_hash, full_name, role]
    )
    return {
        "user_id": user_id,
        "username": username,
        "full_name": full_name,
        "role": role
    }
