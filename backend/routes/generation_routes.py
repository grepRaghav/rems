from flask import Blueprint, request, jsonify
from auth import login_required
from db import execute_query, execute_non_query

generation_bp = Blueprint("generation", __name__, url_prefix="/api/generation")

@generation_bp.route("", methods=["GET"])
@login_required
def list_generation():
    plant_id = request.args.get("plant_id", "").strip()
    date_from = request.args.get("date_from", "").strip()
    date_to = request.args.get("date_to", "").strip()

    sql = """
    SELECT g.GENERATION_ID, g.PLANT_ID, p.PLANT_NAME, p.ENERGY_TYPE,
           g.GENERATION_DATE, g.ENERGY_KWH, g.EFFICIENCY_PERCENT, 
           g.PEAK_OUTPUT_KW, g.REMARKS 
    FROM ENERGY_GENERATION g 
    JOIN POWER_PLANTS p ON g.PLANT_ID = p.PLANT_ID 
    WHERE 1=1
    """
    params = []

    if plant_id:
        sql += " AND g.PLANT_ID = ?"
        params.append(plant_id)

    if date_from:
        sql += " AND g.GENERATION_DATE >= ?"
        params.append(date_from)

    if date_to:
        sql += " AND g.GENERATION_DATE <= ?"
        params.append(date_to)

    sql += " ORDER BY g.GENERATION_DATE DESC, g.GENERATION_ID DESC"

    try:
        rows = execute_query(sql, params)
        return jsonify({"success": True, "count": len(rows), "data": rows}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to list generation logs: {str(e)}"}), 500

@generation_bp.route("/<gen_id>", methods=["GET"])
@login_required
def get_generation(gen_id):
    try:
        rows = execute_query(
            """
            SELECT g.GENERATION_ID, g.PLANT_ID, p.PLANT_NAME,
                   g.GENERATION_DATE, g.ENERGY_KWH, g.EFFICIENCY_PERCENT, 
                   g.PEAK_OUTPUT_KW, g.REMARKS 
            FROM ENERGY_GENERATION g 
            JOIN POWER_PLANTS p ON g.PLANT_ID = p.PLANT_ID 
            WHERE g.GENERATION_ID = ?
            """,
            [gen_id]
        )
        if not rows:
            return jsonify({"success": False, "error": f"Generation log '{gen_id}' not found."}), 404
        return jsonify({"success": True, "data": rows[0]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@generation_bp.route("", methods=["POST"])
@login_required
def create_generation():
    data = request.get_json() or {}
    gen_id = data.get("generation_id", "").strip().upper()
    plant_id = data.get("plant_id", "").strip().upper()
    gen_date = data.get("generation_date", "").strip()
    energy_kwh = data.get("energy_kwh")
    efficiency = data.get("efficiency_percent")
    peak_kw = data.get("peak_output_kw")
    remarks = data.get("remarks", "").strip()

    if not gen_id or not plant_id or not gen_date or energy_kwh is None or efficiency is None:
        return jsonify({"success": False, "error": "Missing required fields (ID, Plant ID, Date, Energy kWh, Efficiency %)."}), 400

    try:
        # Check plant exists
        plant = execute_query("SELECT PLANT_ID FROM POWER_PLANTS WHERE PLANT_ID = ?", [plant_id])
        if not plant:
            return jsonify({"success": False, "error": f"Plant '{plant_id}' does not exist."}), 400

        exists = execute_query("SELECT GENERATION_ID FROM ENERGY_GENERATION WHERE GENERATION_ID = ?", [gen_id])
        if exists:
            return jsonify({"success": False, "error": f"Generation ID '{gen_id}' already exists."}), 409

        execute_non_query(
            """
            INSERT INTO ENERGY_GENERATION (GENERATION_ID, PLANT_ID, GENERATION_DATE, ENERGY_KWH, EFFICIENCY_PERCENT, PEAK_OUTPUT_KW, REMARKS)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [gen_id, plant_id, gen_date, float(energy_kwh), float(efficiency), float(peak_kw) if peak_kw is not None else None, remarks]
        )
        return jsonify({"success": True, "message": f"Generation record '{gen_id}' recorded successfully."}), 201
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error creating generation record: {str(e)}"}), 500

@generation_bp.route("/<gen_id>", methods=["PUT"])
@login_required
def update_generation(gen_id):
    data = request.get_json() or {}
    plant_id = data.get("plant_id", "").strip().upper()
    gen_date = data.get("generation_date", "").strip()
    energy_kwh = data.get("energy_kwh")
    efficiency = data.get("efficiency_percent")
    peak_kw = data.get("peak_output_kw")
    remarks = data.get("remarks", "").strip()

    if not plant_id or not gen_date or energy_kwh is None or efficiency is None:
        return jsonify({"success": False, "error": "Missing required fields for update."}), 400

    try:
        exists = execute_query("SELECT GENERATION_ID FROM ENERGY_GENERATION WHERE GENERATION_ID = ?", [gen_id])
        if not exists:
            return jsonify({"success": False, "error": f"Generation log '{gen_id}' not found."}), 404

        execute_non_query(
            """
            UPDATE ENERGY_GENERATION
            SET PLANT_ID = ?, GENERATION_DATE = ?, ENERGY_KWH = ?, EFFICIENCY_PERCENT = ?, PEAK_OUTPUT_KW = ?, REMARKS = ?
            WHERE GENERATION_ID = ?
            """,
            [plant_id, gen_date, float(energy_kwh), float(efficiency), float(peak_kw) if peak_kw is not None else None, remarks, gen_id]
        )
        return jsonify({"success": True, "message": f"Generation record '{gen_id}' updated successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error updating generation record: {str(e)}"}), 500

@generation_bp.route("/<gen_id>", methods=["DELETE"])
@login_required
def delete_generation(gen_id):
    try:
        exists = execute_query("SELECT GENERATION_ID FROM ENERGY_GENERATION WHERE GENERATION_ID = ?", [gen_id])
        if not exists:
            return jsonify({"success": False, "error": f"Generation record '{gen_id}' not found."}), 404

        execute_non_query("DELETE FROM ENERGY_GENERATION WHERE GENERATION_ID = ?", [gen_id])
        return jsonify({"success": True, "message": f"Generation record '{gen_id}' deleted successfully."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Database error deleting generation record: {str(e)}"}), 500
