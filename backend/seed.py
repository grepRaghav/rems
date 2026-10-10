import sys
import os
from datetime import datetime
from werkzeug.security import generate_password_hash
from db import get_connection, execute_non_query, execute_query, DB_STATUS
from config import Config

def parse_date(date_str):
    """Converts YYYY-MM-DD string to date object for pyodbc Oracle compatibility."""
    return datetime.strptime(date_str, "%Y-%m-%d").date()

def init_tables(conn, engine_type):
    """Ensures tables exist in either Oracle 11g or SQLite."""
    cursor = conn.cursor()
    
    if engine_type == "sqlite_fallback":
        cursor.executescript("""
        CREATE TABLE IF NOT EXISTS APP_USERS (
            USER_ID TEXT PRIMARY KEY,
            USERNAME TEXT UNIQUE NOT NULL,
            PASSWORD_HASH TEXT NOT NULL,
            FULL_NAME TEXT NOT NULL,
            ROLE TEXT DEFAULT 'admin' NOT NULL,
            CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS POWER_PLANTS (
            PLANT_ID TEXT PRIMARY KEY,
            PLANT_NAME TEXT NOT NULL,
            ENERGY_TYPE TEXT NOT NULL,
            LOCATION TEXT NOT NULL,
            CAPACITY_KW NUMERIC NOT NULL,
            INSTALL_DATE DATE NOT NULL,
            STATUS TEXT DEFAULT 'Active' NOT NULL,
            OPERATOR_NAME TEXT
        );

        CREATE TABLE IF NOT EXISTS EQUIPMENT (
            EQUIPMENT_ID TEXT PRIMARY KEY,
            PLANT_ID TEXT NOT NULL REFERENCES POWER_PLANTS(PLANT_ID) ON DELETE CASCADE,
            EQUIPMENT_NAME TEXT NOT NULL,
            CATEGORY TEXT NOT NULL,
            QUANTITY INTEGER DEFAULT 1 NOT NULL,
            UNIT_COST NUMERIC DEFAULT 0.00 NOT NULL,
            STATUS TEXT DEFAULT 'Operational' NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ENERGY_GENERATION (
            GENERATION_ID TEXT PRIMARY KEY,
            PLANT_ID TEXT NOT NULL REFERENCES POWER_PLANTS(PLANT_ID) ON DELETE CASCADE,
            GENERATION_DATE DATE NOT NULL,
            ENERGY_KWH NUMERIC NOT NULL,
            EFFICIENCY_PERCENT NUMERIC NOT NULL,
            PEAK_OUTPUT_KW NUMERIC,
            REMARKS TEXT
        );

        CREATE TABLE IF NOT EXISTS MAINTENANCE_RECORDS (
            RECORD_ID TEXT PRIMARY KEY,
            EQUIPMENT_ID TEXT NOT NULL REFERENCES EQUIPMENT(EQUIPMENT_ID) ON DELETE CASCADE,
            MAINTENANCE_DATE DATE NOT NULL,
            MAINTENANCE_TYPE TEXT NOT NULL,
            TECHNICIAN_NAME TEXT NOT NULL,
            COST NUMERIC DEFAULT 0.00 NOT NULL,
            STATUS TEXT DEFAULT 'Completed' NOT NULL,
            NOTES TEXT
        );

        CREATE TABLE IF NOT EXISTS DISPOSABLE_TEST_TABLE (
            TEST_ID TEXT PRIMARY KEY,
            SAMPLE_NAME TEXT NOT NULL,
            METRIC_VALUE NUMERIC,
            CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        conn.commit()
    else:
        # In Oracle, check if APP_USERS exists; if not, read and execute schema.sql
        try:
            cursor.execute("SELECT COUNT(*) FROM APP_USERS")
        except Exception:
            schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
            with open(schema_path, "r") as f:
                content = f.read()
            # Strip comments and execute clean statements
            lines = [l for l in content.splitlines() if not l.strip().startswith("--")]
            clean_sql = "\n".join(lines)
            stmts = [s.strip().rstrip(';') for s in clean_sql.split(";") if s.strip()]
            for stmt in stmts:
                if not stmt or stmt.upper() == "COMMIT":
                    continue
                try:
                    cursor.execute(stmt)
                    conn.commit()
                except Exception as e:
                    err = str(e)
                    if "ORA-00955" not in err:
                        print(f"Notice: {err}")
    cursor.close()

def seed_data():
    conn, engine_type = get_connection()
    print(f"Connecting to DB: {DB_STATUS['engine']} ({DB_STATUS['driver_name']})")
    
    init_tables(conn, engine_type)
    conn.close()

    # 1. Seed Admin User
    admin_users = execute_query("SELECT USER_ID FROM APP_USERS WHERE USERNAME = ?", ["admin"])
    if not admin_users:
        admin_hash = generate_password_hash("admin123", method='pbkdf2:sha256')
        execute_non_query(
            "INSERT INTO APP_USERS (USER_ID, USERNAME, PASSWORD_HASH, FULL_NAME, ROLE) VALUES (?, ?, ?, ?, ?)",
            ["USR-001", "admin", admin_hash, "Prof. Sharma / System Admin", "admin"]
        )
        print("Created default admin user: admin / admin123")
    else:
        print("Admin user already exists.")

    # 2. Seed Power Plants
    plants = execute_query("SELECT PLANT_ID FROM POWER_PLANTS")
    if not plants:
        plants_data = [
            ("PLANT-101", "Surya Solar Park - Thar", "Solar", "Jodhpur, Rajasthan", 50000.0, parse_date("2022-03-15"), "Active", "Adani Green Energy"),
            ("PLANT-102", "Pawan Wind Energy Hub", "Wind", "Muppandal, Tamil Nadu", 35000.0, parse_date("2021-08-20"), "Active", "Suzlon Renewable Infra"),
            ("PLANT-103", "Tehri Eco Hydro Project", "Hydro", "Tehri, Uttarakhand", 75000.0, parse_date("2020-01-10"), "Active", "THDC India Ltd"),
            ("PLANT-104", "Deccan Biomass Gasifier", "Biomass", "Belgaum, Karnataka", 12000.0, parse_date("2023-05-18"), "Maintenance", "CleanFuel Bio Power"),
            ("PLANT-105", "Kutch Offshore Wind Farm", "Wind", "Mandvi, Gujarat", 45000.0, parse_date("2023-11-01"), "Active", "Tata Power Renewables")
        ]
        for p in plants_data:
            execute_non_query(
                "INSERT INTO POWER_PLANTS (PLANT_ID, PLANT_NAME, ENERGY_TYPE, LOCATION, CAPACITY_KW, INSTALL_DATE, STATUS, OPERATOR_NAME) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                p
            )
        print(f"Seeded {len(plants_data)} Power Plants.")

    # 3. Seed Equipment
    equipment = execute_query("SELECT EQUIPMENT_ID FROM EQUIPMENT")
    if not equipment:
        equip_data = [
            ("EQ-201", "PLANT-101", "Photovoltaic Monocrystalline Arrays", "Solar Panel Array", 240, 18500.00, "Operational"),
            ("EQ-202", "PLANT-101", "SMA Central Inverter 2500kVA", "Inverter", 10, 42000.00, "Operational"),
            ("EQ-203", "PLANT-102", "Gamesa G97 2.0MW Nacelle", "Wind Turbine", 15, 85000.00, "Operational"),
            ("EQ-204", "PLANT-102", "Direct Drive Yaw Drive Mechanism", "Turbine Gearbox", 15, 12500.00, "Needs Service"),
            ("EQ-205", "PLANT-103", "Francis Hydro Turbine Runner", "Turbine", 4, 150000.00, "Operational"),
            ("EQ-206", "PLANT-103", "Step-Up Power Transformer 132kV", "Transformer", 2, 95000.00, "Operational"),
            ("EQ-207", "PLANT-104", "Fluidized Bed Biomass Reactor", "Generator", 3, 62000.00, "Under Repair"),
            ("EQ-208", "PLANT-105", "Offshore Marine Grade Turbines", "Wind Turbine", 8, 110000.00, "Operational")
        ]
        for eq in equip_data:
            execute_non_query(
                "INSERT INTO EQUIPMENT (EQUIPMENT_ID, PLANT_ID, EQUIPMENT_NAME, CATEGORY, QUANTITY, UNIT_COST, STATUS) VALUES (?, ?, ?, ?, ?, ?, ?)",
                eq
            )
        print(f"Seeded {len(equip_data)} Equipment records.")

    # 4. Seed Energy Generation Records
    gen_records = execute_query("SELECT GENERATION_ID FROM ENERGY_GENERATION")
    if not gen_records:
        gen_data = [
            ("GEN-301", "PLANT-101", parse_date("2026-10-01"), 385000.5, 94.2, 48200.0, "Optimal clear sky solar yield"),
            ("GEN-302", "PLANT-101", parse_date("2026-10-02"), 372400.0, 92.5, 47500.0, "Minor dust attenuation in afternoon"),
            ("GEN-303", "PLANT-102", parse_date("2026-10-01"), 265000.0, 88.0, 32100.0, "High monsoon crosswinds recorded"),
            ("GEN-304", "PLANT-102", parse_date("2026-10-02"), 280500.0, 91.2, 33400.0, "Steady winds throughout grid period"),
            ("GEN-305", "PLANT-103", parse_date("2026-10-01"), 620000.0, 97.4, 73500.0, "Reservoir head at maximum capacity"),
            ("GEN-306", "PLANT-103", parse_date("2026-10-02"), 615000.0, 96.8, 72800.0, "Continuous peak hydro load dispatch"),
            ("GEN-307", "PLANT-104", parse_date("2026-10-01"), 72000.0, 78.5, 9800.0, "Feedstock moisture variation"),
            ("GEN-308", "PLANT-105", parse_date("2026-10-01"), 340000.0, 90.5, 42000.0, "Offshore steady breeze sustained")
        ]
        for g in gen_data:
            execute_non_query(
                "INSERT INTO ENERGY_GENERATION (GENERATION_ID, PLANT_ID, GENERATION_DATE, ENERGY_KWH, EFFICIENCY_PERCENT, PEAK_OUTPUT_KW, REMARKS) VALUES (?, ?, ?, ?, ?, ?, ?)",
                g
            )
        print(f"Seeded {len(gen_data)} Energy Generation records.")

    # 5. Seed Maintenance Records
    maint_records = execute_query("SELECT RECORD_ID FROM MAINTENANCE_RECORDS")
    if not maint_records:
        m_data = [
            ("MNT-401", "EQ-202", parse_date("2026-09-15"), "Preventive", "Rajesh Verma (Lead EE)", 12500.0, "Completed", "Inverter thermal paste and capacitor bank checked"),
            ("MNT-402", "EQ-204", parse_date("2026-10-04"), "Corrective", "Anita Deshmukh", 34000.0, "In Progress", "Yaw motor alignment in progress on nacelle #3"),
            ("MNT-403", "EQ-206", parse_date("2026-08-22"), "Inspection", "Kavita Reddy", 8500.0, "Completed", "Transformer oil dielectric breakdown test passed"),
            ("MNT-404", "EQ-207", parse_date("2026-10-05"), "Overhaul", "Vikram Rathore", 55000.0, "Scheduled", "Thermal grate replacement scheduled for upcoming weekend")
        ]
        for m in m_data:
            execute_non_query(
                "INSERT INTO MAINTENANCE_RECORDS (RECORD_ID, EQUIPMENT_ID, MAINTENANCE_DATE, MAINTENANCE_TYPE, TECHNICIAN_NAME, COST, STATUS, NOTES) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                m
            )
        print(f"Seeded {len(m_data)} Maintenance Records.")

    # 6. Seed Disposable Test Table
    disp = execute_query("SELECT TEST_ID FROM DISPOSABLE_TEST_TABLE")
    if not disp:
        d_data = [
            ("TEST-01", "Calibration Sensor A", 84.50),
            ("TEST-02", "Auxiliary Frequency Probe", 50.02),
            ("TEST-03", "Harmonic Filter Meter", 12.30)
        ]
        for d in d_data:
            execute_non_query(
                "INSERT INTO DISPOSABLE_TEST_TABLE (TEST_ID, SAMPLE_NAME, METRIC_VALUE) VALUES (?, ?, ?)",
                d
            )
        print("Seeded disposable test table.")

    print("Database initialization and seeding completed successfully!")

if __name__ == "__main__":
    seed_data()
