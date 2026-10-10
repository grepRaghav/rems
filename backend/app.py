import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from db import get_db_status
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.plants_routes import plants_bp
from routes.equipment_routes import equipment_bp
from routes.generation_routes import generation_bp
from routes.maintenance_routes import maintenance_bp
from routes.sql_routes import sql_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS configuration for local React dev server
    CORS(app, 
         supports_credentials=True, 
         origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(plants_bp)
    app.register_blueprint(equipment_bp)
    app.register_blueprint(generation_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(sql_bp)

    @app.route("/", methods=["GET"])
    def root():
        status = get_db_status()
        return jsonify({
            "name": "Renewable Energy Management System (REMS) API",
            "version": "1.0.0",
            "status": "Online",
            "database_status": status
        })

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found."}), 404

    @app.errorhandler(500)
    def handle_server_error(e):
        return jsonify({"success": False, "error": "Internal server error. Database operation failed."}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting REMS Flask Backend on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
