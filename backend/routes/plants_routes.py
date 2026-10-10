from flask import Blueprint, request, jsonify
from auth import login_required
from db import execute_query, execute_non_query

plants_bp = Blueprint("plants", __name__, url_prefix="/api/plants")

@plants_bp.route("", methods=["GET"])
@login_required
def list_plants():
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    energy_type = request.args.get("energy_type", "").strip()

    sql = "SELECT PLANT_ID, PLANT_NAME, ENERGY_TYPE, LOCATION, CAPACITY_KW, INSTALL_DATE, STATUS, OPERATOR_NAME FROM POWER_PLANTS WHERE 1=1"
    params = []

    if search:
        sql += " AND (UPPER(PLANT_NAME) LIKE UPPER(?) OR UPPER(LOCATION) LIKE UPPER(?) OR UPPER(PLANT_ID) LIKE UPPER(?))"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern])

    if status:
        sql += " AND STATUS = ?"
        params.append(status)

    if energy_type:
        sql += " AND ENERGY_TYPE = ?"
        params.append(energy_type)

    sql += " ORDER BY PLANT_ID ASC"

    try:
        rows = execute_query(sql, params)
        return jsonify({"success": True, "count": len(rows), "data": rows}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to list plants: {str(e)}"}), 500

@plants_bp.route("/<plant_id>", methods=["GET"])
@login_required
def get_plant(plant_id):
    try:
        rows = execute_query(
            "SELECT PLANT_ID, PLANT_NAME, ENERGY_TYPE, LOCATION, CAPACITY_KW, INSTALL_DATE, STATUS, OPERATOR_NAME FROM POWER_PLANTS WHERE PLANT_ID = ?",
            [plant_id]
        )
        if not rows:
            return jsonify({"success": False, "error": f"Plant with ID '{plant_id}' not found."}), 404
        return jsonify({"success": True, "data": rows[0]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@plants_bp.route("", methods=["POST"])
@login_required
def create_plant():
    data = request.get_json() or {}
    plant_id = data.get("plant_id", "").strip().upper()
    plant_name = data.get("plant_name", "").strip()
    energy_type = data.get("energy_type", "").strip()
    location = data.get("location", "").strip()
    capacity_kw = data.get("capacity_kw")
    install_date = data.get("install_date", "").strip()
    status = data.get("status", "Active").strip()
    operator_name = data.get("operator_name", "").strip()

    if not plant_id or not plant_name or not energy_type or not location or capacity_kw is None or not install_date:
        return jsonify({"success": False, "error": "Missing required fields (ID, Name, Energy Type, Location, Capacity, Install Date)."}), 400

    try:
        # Check duplicate
        exists = execute_query("SELECT PLANT_ID FROM POWER_PLANTS WHERE PLANT_ID = ?", [plant_id])
        if exists:
            return jsonify({"success": False, "error": f"Plant ID '{plant_id}' already exists."}), 409

        execute_non_query(
            """
            INSERT INTO POWER_PLANTS (PLANT_ID, PLANT_NAME, ENERGY_TYPE, LOCATION, CAPACITY_KW, INSTALL_DATE, STATUS, OPERATOR_NAME)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [plant_id, plant_name, energy_type, location, float(capacity_kw), install_date, status, operator_name]
        )
        return jsonify({"success": True, "message": f"Power Plant '{plant_name}' created successfully."}), 201
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error creating plant: {str(e)}"}), 500

@plants_bp.route("/<plant_id>", methods=["PUT"])
@login_required
def update_plant(plant_id):
    data = request.get_json() or {}
    plant_name = data.get("plant_name", "").strip()
    energy_type = data.get("energy_type", "").strip()
    location = data.get("location", "").strip()
    capacity_kw = data.get("capacity_kw")
    install_date = data.get("install_date", "").strip()
    status = data.get("status", "Active").strip()
    operator_name = data.get("operator_name", "").strip()

    if not plant_name or not energy_type or not location or capacity_kw is None:
        return jsonify({"success": False, "error": "Missing required fields for update."}), 400

    try:
        exists = execute_query("SELECT PLANT_ID FROM POWER_PLANTS WHERE PLANT_ID = ?", [plant_id])
        if not exists:
            return jsonify({"success": False, "error": f"Plant '{plant_id}' not found."}), 404

        execute_non_query(
            """
            UPDATE POWER_PLANTS
            SET PLANT_NAME = ?, ENERGY_TYPE = ?, LOCATION = ?, CAPACITY_KW = ?, INSTALL_DATE = ?, STATUS = ?, OPERATOR_NAME = ?
            WHERE PLANT_ID = ?
            """,
            [plant_name, energy_type, location, float(capacity_kw), install_date, status, operator_name, plant_id]
        )
        return jsonify({"success": True, "message": f"Power Plant '{plant_id}' updated successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error updating plant: {str(e)}"}), 500

@plants_bp.route("/<plant_id>", methods=["DELETE"])
@login_required
def delete_plant(plant_id):
    try:
        exists = execute_query("SELECT PLANT_ID FROM POWER_PLANTS WHERE PLANT_ID = ?", [plant_id])
        if not exists:
            return jsonify({"success": False, "error": f"Plant '{plant_id}' not found."}), 404

        # Delete cascades to EQUIPMENT and ENERGY_GENERATION in Oracle
        execute_non_query("DELETE FROM POWER_PLANTS WHERE PLANT_ID = ?", [plant_id])
        return jsonify({"success": True, "message": f"Power Plant '{plant_id}' deleted successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error deleting plant: {str(e)}"}), 500
