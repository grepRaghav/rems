from flask import Blueprint, jsonify
from auth import login_required
from db import execute_query, get_db_status

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")

@dashboard_bp.route("/dashboard/stats", methods=["GET"])
@login_required
def get_dashboard_stats():
    try:
        # Aggregations using parameterized queries
        plant_stats = execute_query(
            "SELECT COUNT(*) AS TOTAL_PLANTS, COALESCE(SUM(CAPACITY_KW), 0) AS TOTAL_CAPACITY FROM POWER_PLANTS"
        )
        total_plants = plant_stats[0]["TOTAL_PLANTS"] if plant_stats else 0
        total_capacity = plant_stats[0]["TOTAL_CAPACITY"] if plant_stats else 0

        equip_stats = execute_query(
            "SELECT COUNT(*) AS TOTAL_EQUIP, COALESCE(SUM(QUANTITY), 0) AS TOTAL_UNITS FROM EQUIPMENT"
        )
        total_equipment = equip_stats[0]["TOTAL_EQUIP"] if equip_stats else 0
        total_units = equip_stats[0]["TOTAL_UNITS"] if equip_stats else 0

        energy_stats = execute_query(
            "SELECT COALESCE(SUM(ENERGY_KWH), 0) AS TOTAL_ENERGY, COALESCE(AVG(EFFICIENCY_PERCENT), 0) AS AVG_EFFICIENCY FROM ENERGY_GENERATION"
        )
        total_energy = energy_stats[0]["TOTAL_ENERGY"] if energy_stats else 0
        avg_efficiency = round(energy_stats[0]["AVG_EFFICIENCY"], 1) if energy_stats else 0

        maint_stats = execute_query(
            "SELECT COUNT(*) AS ACTIVE_MAINT FROM MAINTENANCE_RECORDS WHERE STATUS IN ('Scheduled', 'In Progress')"
        )
        active_maintenance = maint_stats[0]["ACTIVE_MAINT"] if maint_stats else 0

        # Energy type breakdown
        energy_by_type = execute_query(
            "SELECT ENERGY_TYPE, COUNT(*) AS PLANT_COUNT, COALESCE(SUM(CAPACITY_KW), 0) AS TOTAL_KW FROM POWER_PLANTS GROUP BY ENERGY_TYPE ORDER BY TOTAL_KW DESC"
        )

        # Recent records across entities
        recent_generation = execute_query(
            """
            SELECT g.GENERATION_ID, g.PLANT_ID, p.PLANT_NAME, g.GENERATION_DATE, g.ENERGY_KWH, g.EFFICIENCY_PERCENT 
            FROM ENERGY_GENERATION g 
            JOIN POWER_PLANTS p ON g.PLANT_ID = p.PLANT_ID 
            ORDER BY g.GENERATION_DATE DESC
            """
        )[:5]

        recent_maintenance = execute_query(
            """
            SELECT m.RECORD_ID, m.EQUIPMENT_ID, e.EQUIPMENT_NAME, m.MAINTENANCE_DATE, m.MAINTENANCE_TYPE, m.STATUS 
            FROM MAINTENANCE_RECORDS m 
            JOIN EQUIPMENT e ON m.EQUIPMENT_ID = e.EQUIPMENT_ID 
            ORDER BY m.MAINTENANCE_DATE DESC
            """
        )[:5]

        db_status = get_db_status()

        return jsonify({
            "success": True,
            "stats": {
                "total_plants": total_plants,
                "total_capacity_kw": total_capacity,
                "total_equipment": total_equipment,
                "total_equipment_units": total_units,
                "total_energy_kwh": total_energy,
                "avg_efficiency_percent": avg_efficiency,
                "active_maintenance": active_maintenance
            },
            "energy_by_type": energy_by_type,
            "recent_generation": recent_generation,
            "recent_maintenance": recent_maintenance,
            "db_status": db_status
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to retrieve dashboard metrics: {str(e)}"
        }), 500

@dashboard_bp.route("/health", methods=["GET"])
def health():
    db_status = get_db_status()
    return jsonify({
        "status": "healthy",
        "service": "Renewable Energy Management System (REMS) API",
        "database": db_status
    }), 200
