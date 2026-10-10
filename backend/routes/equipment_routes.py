from flask import Blueprint, request, jsonify
from auth import login_required
from db import execute_query, execute_non_query

equipment_bp = Blueprint("equipment", __name__, url_prefix="/api/equipment")

@equipment_bp.route("", methods=["GET"])
@login_required
def list_equipment():
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    plant_id = request.args.get("plant_id", "").strip()
    status = request.args.get("status", "").strip()

    sql = """
    SELECT e.EQUIPMENT_ID, e.PLANT_ID, p.PLANT_NAME, e.EQUIPMENT_NAME, 
           e.CATEGORY, e.QUANTITY, e.UNIT_COST, (e.QUANTITY * e.UNIT_COST) AS TOTAL_VALUATION,
           e.STATUS 
    FROM EQUIPMENT e 
    JOIN POWER_PLANTS p ON e.PLANT_ID = p.PLANT_ID 
    WHERE 1=1
    """
    params = []

    if search:
        sql += " AND (UPPER(e.EQUIPMENT_NAME) LIKE UPPER(?) OR UPPER(e.EQUIPMENT_ID) LIKE UPPER(?) OR UPPER(p.PLANT_NAME) LIKE UPPER(?))"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern])

    if category:
        sql += " AND e.CATEGORY = ?"
        params.append(category)

    if plant_id:
        sql += " AND e.PLANT_ID = ?"
        params.append(plant_id)

    if status:
        sql += " AND e.STATUS = ?"
        params.append(status)

    sql += " ORDER BY e.EQUIPMENT_ID ASC"

    try:
        rows = execute_query(sql, params)
        return jsonify({"success": True, "count": len(rows), "data": rows}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to list equipment: {str(e)}"}), 500

@equipment_bp.route("/<equip_id>", methods=["GET"])
@login_required
def get_equipment(equip_id):
    try:
        rows = execute_query(
            """
            SELECT e.EQUIPMENT_ID, e.PLANT_ID, p.PLANT_NAME, e.EQUIPMENT_NAME, 
                   e.CATEGORY, e.QUANTITY, e.UNIT_COST, e.STATUS 
            FROM EQUIPMENT e 
            JOIN POWER_PLANTS p ON e.PLANT_ID = p.PLANT_ID 
            WHERE e.EQUIPMENT_ID = ?
            """,
            [equip_id]
        )
        if not rows:
            return jsonify({"success": False, "error": f"Equipment '{equip_id}' not found."}), 404
        return jsonify({"success": True, "data": rows[0]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@equipment_bp.route("", methods=["POST"])
@login_required
def create_equipment():
    data = request.get_json() or {}
    equip_id = data.get("equipment_id", "").strip().upper()
    plant_id = data.get("plant_id", "").strip().upper()
    equip_name = data.get("equipment_name", "").strip()
    category = data.get("category", "").strip()
    quantity = data.get("quantity")
    unit_cost = data.get("unit_cost", 0.0)
    status = data.get("status", "Operational").strip()

    if not equip_id or not plant_id or not equip_name or not category or quantity is None:
        return jsonify({"success": False, "error": "Missing required fields (ID, Plant ID, Name, Category, Quantity)."}), 400

    try:
        # Check foreign key plant_id
        plant = execute_query("SELECT PLANT_ID FROM POWER_PLANTS WHERE PLANT_ID = ?", [plant_id])
        if not plant:
            return jsonify({"success": False, "error": f"Referenced Power Plant '{plant_id}' does not exist."}), 400

        # Check duplicate
        exists = execute_query("SELECT EQUIPMENT_ID FROM EQUIPMENT WHERE EQUIPMENT_ID = ?", [equip_id])
        if exists:
            return jsonify({"success": False, "error": f"Equipment ID '{equip_id}' already exists."}), 409

        execute_non_query(
            """
            INSERT INTO EQUIPMENT (EQUIPMENT_ID, PLANT_ID, EQUIPMENT_NAME, CATEGORY, QUANTITY, UNIT_COST, STATUS)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [equip_id, plant_id, equip_name, category, int(quantity), float(unit_cost), status]
        )
        return jsonify({"success": True, "message": f"Equipment '{equip_name}' added successfully."}), 201
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error creating equipment: {str(e)}"}), 500

@equipment_bp.route("/<equip_id>", methods=["PUT"])
@login_required
def update_equipment(equip_id):
    data = request.get_json() or {}
    plant_id = data.get("plant_id", "").strip().upper()
    equip_name = data.get("equipment_name", "").strip()
    category = data.get("category", "").strip()
    quantity = data.get("quantity")
    unit_cost = data.get("unit_cost")
    status = data.get("status", "Operational").strip()

    if not equip_name or not category or quantity is None or unit_cost is None:
        return jsonify({"success": False, "error": "Missing required fields for update."}), 400

    try:
        exists = execute_query("SELECT EQUIPMENT_ID FROM EQUIPMENT WHERE EQUIPMENT_ID = ?", [equip_id])
        if not exists:
            return jsonify({"success": False, "error": f"Equipment '{equip_id}' not found."}), 404

        execute_non_query(
            """
            UPDATE EQUIPMENT
            SET PLANT_ID = ?, EQUIPMENT_NAME = ?, CATEGORY = ?, QUANTITY = ?, UNIT_COST = ?, STATUS = ?
            WHERE EQUIPMENT_ID = ?
            """,
            [plant_id, equip_name, category, int(quantity), float(unit_cost), status, equip_id]
        )
        return jsonify({"success": True, "message": f"Equipment '{equip_id}' updated successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error updating equipment: {str(e)}"}), 500

@equipment_bp.route("/<equip_id>", methods=["DELETE"])
@login_required
def delete_equipment(equip_id):
    try:
        exists = execute_query("SELECT EQUIPMENT_ID FROM EQUIPMENT WHERE EQUIPMENT_ID = ?", [equip_id])
        if not exists:
            return jsonify({"success": False, "error": f"Equipment '{equip_id}' not found."}), 404

        execute_non_query("DELETE FROM EQUIPMENT WHERE EQUIPMENT_ID = ?", [equip_id])
        return jsonify({"success": True, "message": f"Equipment '{equip_id}' deleted successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error deleting equipment: {str(e)}"}), 500
