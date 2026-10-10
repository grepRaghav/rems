import re
import time
from flask import Blueprint, request, jsonify
from auth import login_required, admin_required
from db import execute_raw_ddl_dml, get_db_status

sql_bp = Blueprint("sql", __name__, url_prefix="/api/sql")

FORBIDDEN_KEYWORDS = [
    r"\bGRANT\b", r"\bREVOKE\b", r"\bDROP\s+USER\b", r"\bALTER\s+USER\b",
    r"\bCREATE\s+USER\b", r"\bSHUTDOWN\b", r"\bSTARTUP\b",
    r"\bCOMMIT\b", r"\bROLLBACK\b", r"\bSAVEPOINT\b",
    r"\bSYS\.", r"\bDBA_", r"\bV\$"
]

CORE_PROTECTED_TABLES = [
    "APP_USERS", "POWER_PLANTS", "EQUIPMENT", "ENERGY_GENERATION", "MAINTENANCE_RECORDS"
]

def validate_sql(raw_sql: str):
    """
    Validates a SQL query for safety in an academic demonstration console.
    Returns (is_valid: bool, error_message: str, category: str)
    """
    cleaned = raw_sql.strip().rstrip(';').strip()
    if not cleaned:
        return False, "Query cannot be empty.", None

    # Check for multi-statement execution (semicolons in middle)
    if ";" in cleaned:
        return False, "Multi-statement execution is disabled for safety. Please submit a single statement.", None

    sql_upper = cleaned.upper()

    # Check forbidden keywords
    for pattern in FORBIDDEN_KEYWORDS:
        if re.search(pattern, sql_upper):
            return False, f"Security Violation: Statement contains restricted administrative or transaction command matching '{pattern}'.", None

    first_word = sql_upper.split()[0] if sql_upper.split() else ""

    # DDL
    if first_word in ("CREATE", "ALTER", "DROP"):
        category = "DDL"
        if first_word == "DROP":
            # Safety rule: DROP TABLE is ONLY permitted on disposable test table or names starting with TEST_ / TEMP_ / DISPOSABLE_
            match = re.search(r"DROP\s+TABLE\s+([A-Za-z0-9_]+)", sql_upper)
            if not match:
                return False, "Invalid DROP TABLE syntax. Expected: DROP TABLE <table_name>", None
            target_table = match.group(1).upper()
            
            # Check if attempting to drop core table
            if target_table in CORE_PROTECTED_TABLES:
                return False, f"Safety restriction: Dropping core application table '{target_table}' is strictly prohibited. Use 'DISPOSABLE_TEST_TABLE' for destructive testing.", None
            
            # Allow disposable test table or prefix TEST_/TEMP_/DISPOSABLE_
            allowed_prefixes = ("TEST_", "TEMP_", "DISPOSABLE_")
            if not (target_table.startswith(allowed_prefixes) or target_table == "DISPOSABLE_TEST_TABLE"):
                return False, f"Safety restriction: DROP TABLE is only allowed on disposable tables (e.g. 'DISPOSABLE_TEST_TABLE' or tables prefixed with 'TEST_').", None

        elif first_word == "ALTER":
            # Prevent altering core table schemas in ways that break the app
            match = re.search(r"ALTER\s+TABLE\s+([A-Za-z0-9_]+)", sql_upper)
            if match:
                target_table = match.group(1).upper()
                if target_table in CORE_PROTECTED_TABLES and "DROP" in sql_upper:
                    return False, f"Safety restriction: Dropping columns from core table '{target_table}' is prohibited.", None

        return True, None, category

    # DML
    elif first_word in ("INSERT", "UPDATE", "DELETE"):
        category = "DML"
        return True, None, category

    # DQL
    elif first_word in ("SELECT", "WITH"):
        category = "DQL"
        return True, None, category

    else:
        return False, f"Unsupported statement type '{first_word}'. Only DDL (CREATE, ALTER, DROP), DML (INSERT, UPDATE, DELETE), and DQL (SELECT) are permitted.", None


@sql_bp.route("/execute", methods=["POST"])
@login_required
@admin_required
def execute_sql():
    data = request.get_json() or {}
    query = data.get("query", "").strip()

    is_valid, validation_error, category = validate_sql(query)
    if not is_valid:
        return jsonify({
            "success": False,
            "error": validation_error,
            "validation_passed": False
        }), 400

    start_time = time.time()
    result = execute_raw_ddl_dml(query)
    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    result["elapsed_ms"] = elapsed_ms
    result["category"] = category
    result["validation_passed"] = True
    result["validator_notes"] = "Validated against single-statement allowlist & safe disposable table policies."

    status_code = 200 if result.get("success") else 400
    return jsonify(result), status_code


@sql_bp.route("/examples", methods=["GET"])
@login_required
def get_examples():
    """Provides curated academic examples for DDL, DML, and DQL demonstrating DBMS concepts."""
    examples = {
        "DDL": [
            {
                "title": "CREATE TABLE (Disposable Test Table)",
                "description": "Demonstrates creating a new relational table with primary key and data types.",
                "sql": "CREATE TABLE TEST_SENSOR_METRICS (\n    SENSOR_ID VARCHAR2(20) PRIMARY KEY,\n    LOCATION_TAG VARCHAR2(50) NOT NULL,\n    VOLTAGE_READING NUMBER(8, 2),\n    RECORDED_AT DATE DEFAULT SYSDATE\n)"
            },
            {
                "title": "ALTER TABLE (Add Column)",
                "description": "Demonstrates schema modification by adding a new column to a test table.",
                "sql": "ALTER TABLE DISPOSABLE_TEST_TABLE ADD (CALIBRATION_STATUS VARCHAR2(30) DEFAULT 'Valid')"
            },
            {
                "title": "DROP TABLE (Disposable Test Table)",
                "description": "Demonstrates safe object dropping strictly restricted to disposable test tables.",
                "sql": "DROP TABLE TEST_SENSOR_METRICS"
            }
        ],
        "DML": [
            {
                "title": "INSERT (New Equipment Record)",
                "description": "Demonstrates adding a row into an existing table.",
                "sql": "INSERT INTO DISPOSABLE_TEST_TABLE (TEST_ID, SAMPLE_NAME, METRIC_VALUE)\nVALUES ('TEST-99', 'Solar Irradiance Pyranometer', 1045.50)"
            },
            {
                "title": "UPDATE (Record Modification)",
                "description": "Demonstrates updating existing column values with a WHERE condition.",
                "sql": "UPDATE DISPOSABLE_TEST_TABLE\nSET METRIC_VALUE = 1120.75\nWHERE TEST_ID = 'TEST-99'"
            },
            {
                "title": "DELETE (Conditional Row Removal)",
                "description": "Demonstrates removing specific rows safely.",
                "sql": "DELETE FROM DISPOSABLE_TEST_TABLE\nWHERE TEST_ID = 'TEST-99'"
            }
        ],
        "DQL": [
            {
                "title": "SELECT with WHERE & ORDER BY",
                "description": "Filters plants by capacity > 30,000 kW and orders by capacity descending.",
                "sql": "SELECT PLANT_ID, PLANT_NAME, ENERGY_TYPE, CAPACITY_KW, LOCATION\nFROM POWER_PLANTS\nWHERE CAPACITY_KW >= 30000\nORDER BY CAPACITY_KW DESC"
            },
            {
                "title": "INNER JOIN (Plants and Equipment)",
                "description": "Demonstrates relational query joining power plants with their installed equipment.",
                "sql": "SELECT p.PLANT_NAME, p.ENERGY_TYPE, e.EQUIPMENT_NAME, e.CATEGORY, e.QUANTITY, e.UNIT_COST\nFROM POWER_PLANTS p\nINNER JOIN EQUIPMENT e ON p.PLANT_ID = e.PLANT_ID\nORDER BY p.PLANT_NAME, e.EQUIPMENT_NAME"
            },
            {
                "title": "GROUP BY with Aggregate Functions (COUNT, SUM, AVG)",
                "description": "Calculates total capacity and average plant capacity grouped by energy type.",
                "sql": "SELECT ENERGY_TYPE, \n       COUNT(*) AS TOTAL_PLANTS, \n       SUM(CAPACITY_KW) AS TOTAL_CAPACITY_KW, \n       ROUND(AVG(CAPACITY_KW), 2) AS AVG_CAPACITY_KW\nFROM POWER_PLANTS\nGROUP BY ENERGY_TYPE\nORDER BY TOTAL_CAPACITY_KW DESC"
            },
            {
                "title": "GROUP BY with HAVING Clause",
                "description": "Groups energy generation logs by plant and filters those with total generation exceeding 500,000 kWh.",
                "sql": "SELECT p.PLANT_NAME,\n       COUNT(g.GENERATION_ID) AS LOG_ENTRIES,\n       SUM(g.ENERGY_KWH) AS TOTAL_GENERATION_KWH,\n       ROUND(AVG(g.EFFICIENCY_PERCENT), 2) AS AVG_EFFICIENCY\nFROM POWER_PLANTS p\nJOIN ENERGY_GENERATION g ON p.PLANT_ID = g.PLANT_ID\nGROUP BY p.PLANT_NAME\nHAVING SUM(g.ENERGY_KWH) > 500000\nORDER BY TOTAL_GENERATION_KWH DESC"
            }
        ]
    }
    return jsonify({"success": True, "examples": examples}), 200
