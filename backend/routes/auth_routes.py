from flask import Blueprint, request, jsonify, session
from auth import authenticate_user, login_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({
            "success": False,
            "error": "Username and password are required."
        }), 400

    user = authenticate_user(username, password)
    if not user:
        return jsonify({
            "success": False,
            "error": "Invalid username or password. Please verify credentials."
        }), 401

    # Store user in Flask session
    session.clear()
    session["user_id"] = user["user_id"]
    session["username"] = user["username"]
    session["full_name"] = user["full_name"]
    session["role"] = user["role"]
    session.permanent = True

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "user": user
    }), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({
        "success": True,
        "message": "Logged out successfully."
    }), 200

@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return jsonify({
        "success": True,
        "user": {
            "user_id": session.get("user_id"),
            "username": session.get("username"),
            "full_name": session.get("full_name"),
            "role": session.get("role")
        }
    }), 200
