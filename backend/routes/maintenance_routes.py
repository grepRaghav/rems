from flask import Blueprint, request, jsonify
from auth import login_required
from db import execute_query, execute_non_query

maintenance_bp = Blueprint("maintenance", __name__, url_prefix="/api/maintenance")

@maintenance_bp.route("", methods=["GET"])
@login_required
def list_maintenance():
    status = request.args.get("status", "").strip()
    maint_type = request.args.get("type", "").strip()
    equipment_id = request.args.get("equipment_id", "").strip()

    sql = """
    SELECT m.RECORD_ID, m.EQUIPMENT_ID, e.EQUIPMENT_NAME, p.PLANT_NAME,
           m.MAINTENANCE_DATE, m.MAINTENANCE_TYPE, m.TECHNICIAN_NAME, 
           m.COST, m.STATUS, m.NOTES 
    FROM MAINTENANCE_RECORDS m 
    JOIN EQUIPMENT e ON m.EQUIPMENT_ID = e.EQUIPMENT_ID 
    JOIN POWER_PLANTS p ON e.PLANT_ID = p.PLANT_ID 
    WHERE 1=1
    """
    params = []

    if status:
        sql += " AND m.STATUS = ?"
        params.append(status)

    if maint_type:
        sql += " AND m.MAINTENANCE_TYPE = ?"
        params.append(maint_type)

    if equipment_id:
        sql += " AND m.EQUIPMENT_ID = ?"
        params.append(equipment_id)

    sql += " ORDER BY m.MAINTENANCE_DATE DESC, m.RECORD_ID DESC"

    try:
        rows = execute_query(sql, params)
        return jsonify({"success": True, "count": len(rows), "data": rows}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to list maintenance records: {str(e)}"}), 500

@maintenance_bp.route("/<rec_id>", methods=["GET"])
@login_required
def get_maintenance(rec_id):
    try:
        rows = execute_query(
            """
            SELECT m.RECORD_ID, m.EQUIPMENT_ID, e.EQUIPMENT_NAME, p.PLANT_NAME,
                   m.MAINTENANCE_DATE, m.MAINTENANCE_TYPE, m.TECHNICIAN_NAME, 
                   m.COST, m.STATUS, m.NOTES 
            FROM MAINTENANCE_RECORDS m 
            JOIN EQUIPMENT e ON m.EQUIPMENT_ID = e.EQUIPMENT_ID 
            JOIN POWER_PLANTS p ON e.PLANT_ID = p.PLANT_ID 
            WHERE m.RECORD_ID = ?
            """,
            [rec_id]
        )
        if not rows:
            return jsonify({"success": False, "error": f"Maintenance record '{rec_id}' not found."}), 404
        return jsonify({"success": True, "data": rows[0]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@maintenance_bp.route("", methods=["POST"])
@login_required
def create_maintenance():
    data = request.get_json() or {}
    rec_id = data.get("record_id", "").strip().upper()
    equip_id = data.get("equipment_id", "").strip().upper()
    maint_date = data.get("maintenance_date", "").strip()
    maint_type = data.get("maintenance_type", "").strip()
    technician = data.get("technician_name", "").strip()
    cost = data.get("cost", 0.0)
    status = data.get("status", "Completed").strip()
    notes = data.get("notes", "").strip()

    if not rec_id or not equip_id or not maint_date or not maint_type or not technician:
        return jsonify({"success": False, "error": "Missing required fields (Record ID, Equipment ID, Date, Type, Technician)."}), 400

    try:
        # Check equip exists
        equip = execute_query("SELECT EQUIPMENT_ID FROM EQUIPMENT WHERE EQUIPMENT_ID = ?", [equip_id])
        if not equip:
            return jsonify({"success": False, "error": f"Equipment '{equip_id}' does not exist."}), 400

        exists = execute_query("SELECT RECORD_ID FROM MAINTENANCE_RECORDS WHERE RECORD_ID = ?", [rec_id])
        if exists:
            return jsonify({"success": False, "error": f"Record ID '{rec_id}' already exists."}), 409

        execute_non_query(
            """
            INSERT INTO MAINTENANCE_RECORDS (RECORD_ID, EQUIPMENT_ID, MAINTENANCE_DATE, MAINTENANCE_TYPE, TECHNICIAN_NAME, COST, STATUS, NOTES)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [rec_id, equip_id, maint_date, maint_type, technician, float(cost), status, notes]
        )
        return jsonify({"success": True, "message": f"Maintenance log '{rec_id}' added successfully."}), 201
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error creating maintenance record: {str(e)}"}), 500

@maintenance_bp.route("/<rec_id>", methods=["PUT"])
@login_required
def update_maintenance(rec_id):
    data = request.get_json() or {}
    equip_id = data.get("equipment_id", "").strip().upper()
    maint_date = data.get("maintenance_date", "").strip()
    maint_type = data.get("maintenance_type", "").strip()
    technician = data.get("technician_name", "").strip()
    cost = data.get("cost", 0.0)
    status = data.get("status", "Completed").strip()
    notes = data.get("notes", "").strip()

    if not equip_id or not maint_date or not maint_type or not technician:
        return jsonify({"success": False, "error": "Missing required fields for update."}), 400

    try:
        exists = execute_query("SELECT RECORD_ID FROM MAINTENANCE_RECORDS WHERE RECORD_ID = ?", [rec_id])
        if not exists:
            return jsonify({"success": False, "error": f"Maintenance record '{rec_id}' not found."}), 404

        execute_non_query(
            """
            UPDATE MAINTENANCE_RECORDS
            SET EQUIPMENT_ID = ?, MAINTENANCE_DATE = ?, MAINTENANCE_TYPE = ?, TECHNICIAN_NAME = ?, COST = ?, STATUS = ?, NOTES = ?
            WHERE RECORD_ID = ?
            """,
            [equip_id, maint_date, maint_type, technician, float(cost), status, notes, rec_id]
        )
        return jsonify({"success": True, "message": f"Maintenance log '{rec_id}' updated successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error updating maintenance record: {str(e)}"}), 500

@maintenance_bp.route("/<rec_id>", methods=["DELETE"])
@login_required
def delete_maintenance(rec_id):
    try:
        exists = execute_query("SELECT RECORD_ID FROM MAINTENANCE_RECORDS WHERE RECORD_ID = ?", [rec_id])
        if not exists:
            return jsonify({"success": False, "error": f"Maintenance record '{rec_id}' not found."}), 404

        execute_non_query("DELETE FROM MAINTENANCE_RECORDS WHERE RECORD_ID = ?", [rec_id])
        return jsonify({"success": True, "message": f"Maintenance log '{rec_id}' deleted successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error deleting maintenance record: {str(e)}"}), 500
