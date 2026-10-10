import os
import sqlite3
import logging
from config import Config

logger = logging.getLogger("rems.db")
logging.basicConfig(level=logging.INFO)

# Global status tracking
DB_STATUS = {
    "engine": "unknown",
    "connected": False,
    "is_fallback": False,
    "driver_name": None,
    "last_error": None,
    "database_name": "Oracle 11g XE"
}

def get_connection():
    """
    Acquires a database connection.
    Attempts:
    1. pyodbc with Oracle ODBC Driver / DSN
    2. oracledb (if installed)
    3. SQLite development fallback if Oracle is unreachable.
    """
    global DB_STATUS

    # 1. Try pyodbc if configured or auto
    if Config.DB_CONNECTION_MODE in ("auto", "odbc"):
        try:
            import pyodbc
            # Try DSN first if provided
            conn_str = f"DSN={Config.ORACLE_DSN};UID={Config.ORACLE_USER};PWD={Config.ORACLE_PASSWORD}"
            try:
                conn = pyodbc.connect(conn_str, autocommit=False)
                # Set ISO standard date format on Oracle session
                try:
                    cur = conn.cursor()
                    cur.execute("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD HH24:MI:SS'")
                    cur.close()
                except Exception:
                    pass
                DB_STATUS["engine"] = "Oracle 11g"
                DB_STATUS["driver_name"] = f"pyodbc (DSN: {Config.ORACLE_DSN})"
                DB_STATUS["connected"] = True
                DB_STATUS["is_fallback"] = False
                DB_STATUS["last_error"] = None
                return conn, "oracle_pyodbc"
            except Exception as dsn_err:
                # Try direct Driver connection string
                driver_conn_str = (
                    f"Driver={{{Config.ORACLE_DRIVER}}};"
                    f"Dbq={Config.ORACLE_HOST}:{Config.ORACLE_PORT}/{Config.ORACLE_SERVICE};"
                    f"Uid={Config.ORACLE_USER};"
                    f"Pwd={Config.ORACLE_PASSWORD};"
                )
                conn = pyodbc.connect(driver_conn_str, autocommit=False)
                try:
                    cur = conn.cursor()
                    cur.execute("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD HH24:MI:SS'")
                    cur.close()
                except Exception:
                    pass
                DB_STATUS["engine"] = "Oracle 11g"
                DB_STATUS["driver_name"] = f"pyodbc ({Config.ORACLE_DRIVER})"
                DB_STATUS["connected"] = True
                DB_STATUS["is_fallback"] = False
                DB_STATUS["last_error"] = None
                return conn, "oracle_pyodbc"
        except Exception as pyodbc_err:
            DB_STATUS["last_error"] = str(pyodbc_err)
            logger.warning(f"pyodbc Oracle connection failed: {pyodbc_err}")

    # 2. Try oracledb as alternative Oracle connector
    if Config.DB_CONNECTION_MODE in ("auto", "oracledb"):
        try:
            import oracledb
            dsn_str = f"{Config.ORACLE_HOST}:{Config.ORACLE_PORT}/{Config.ORACLE_SERVICE}"
            conn = oracledb.connect(
                user=Config.ORACLE_USER,
                password=Config.ORACLE_PASSWORD,
                dsn=dsn_str
            )
            DB_STATUS["engine"] = "Oracle 11g"
            DB_STATUS["driver_name"] = "python-oracledb"
            DB_STATUS["connected"] = True
            DB_STATUS["is_fallback"] = False
            DB_STATUS["last_error"] = None
            return conn, "oracle_oracledb"
        except Exception as ora_err:
            DB_STATUS["last_error"] = str(ora_err)
            logger.warning(f"oracledb connection failed: {ora_err}")

    # 3. Development Fallback: SQLite
    # Explicitly labeled dev fallback so the app works seamlessly even before Oracle ODBC is configured
    DB_STATUS["engine"] = "SQLite Dev Fallback"
    DB_STATUS["driver_name"] = "sqlite3 (Dev Mode)"
    DB_STATUS["connected"] = True
    DB_STATUS["is_fallback"] = True

    db_path = os.path.join(os.path.dirname(__file__), "dev_fallback.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn, "sqlite_fallback"


from datetime import datetime, date
import re

def _normalize_params(params):
    if not params:
        return ()
    norm = []
    for item in params:
        if isinstance(item, str):
            val = item.strip()
            if re.match(r"^\d{4}-\d{2}-\d{2}$", val):
                try:
                    norm.append(datetime.strptime(val, "%Y-%m-%d").date())
                    continue
                except ValueError:
                    pass
        norm.append(item)
    return tuple(norm)

def execute_query(sql, params=None):
    """
    Executes a SELECT query using parameterized inputs.
    Returns a list of dicts.
    """
    conn, engine_type = get_connection()
    cursor = None
    try:
        cursor = conn.cursor()
        
        # Prepare parameters and normalize date strings for Oracle
        p = _normalize_params(params)
        
        # Adjust SQL syntax slightly if needed for SQLite compatibility in fallback mode
        query = sql
        if engine_type == "sqlite_fallback":
            query = query.replace("SYSDATE", "CURRENT_TIMESTAMP")
        
        cursor.execute(query, p)
        
        columns = [col[0].upper() for col in cursor.description] if cursor.description else []
        rows = cursor.fetchall()
        
        result = []
        for row in rows:
            if isinstance(row, sqlite3.Row):
                result.append({k.upper(): row[k] for k in row.keys()})
            elif isinstance(row, (tuple, list)):
                result.append({columns[i]: row[i] for i in range(len(columns))})
            else:
                # pyodbc Row object
                row_dict = {}
                for i, col in enumerate(columns):
                    row_dict[col] = row[i]
                result.append(row_dict)
                
        return result
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass


def execute_non_query(sql, params=None):
    """
    Executes an INSERT, UPDATE, or DELETE query using parameterized inputs.
    Returns rows_affected.
    """
    conn, engine_type = get_connection()
    cursor = None
    try:
        cursor = conn.cursor()
        p = _normalize_params(params)
        
        query = sql
        if engine_type == "sqlite_fallback":
            query = query.replace("SYSDATE", "CURRENT_TIMESTAMP")
            
        cursor.execute(query, p)
        conn.commit()
        
        rowcount = cursor.rowcount if cursor.rowcount is not None else 1
        return rowcount
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        raise e
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass


def execute_raw_ddl_dml(sql):
    """
    Executes raw DDL or DML statements (used for the SQL console demo).
    Ensures safe execution and returns detailed execution info.
    """
    conn, engine_type = get_connection()
    cursor = None
    try:
        cursor = conn.cursor()
        
        query = sql.strip().rstrip(';').strip()
        if engine_type == "sqlite_fallback":
            query = query.replace("SYSDATE", "CURRENT_TIMESTAMP")
            query = query.replace("VARCHAR2", "VARCHAR")
            query = query.replace("NUMBER(12, 2)", "NUMERIC")
            query = query.replace("NUMBER", "INTEGER")
            
            # Handle Oracle ADD (...) syntax for SQLite
            if "ALTER TABLE" in query.upper() and "ADD" in query.upper() and "(" in query:
                import re
                m = re.search(r"ALTER\s+TABLE\s+([A-Za-z0-9_]+)\s+ADD\s*\((.*)\)", query, re.IGNORECASE)
                if m:
                    tbl = m.group(1)
                    col_def = m.group(2).strip()
                    query = f"ALTER TABLE {tbl} ADD COLUMN {col_def}"
            
        cursor.execute(query)
        
        # Check if it was a SELECT query or returned rows
        if cursor.description:
            columns = [col[0].upper() for col in cursor.description]
            rows = cursor.fetchall()
            result = []
            for row in rows:
                if isinstance(row, sqlite3.Row):
                    result.append({k.upper(): row[k] for k in row.keys()})
                else:
                    result.append({columns[i]: row[i] for i in range(len(columns))})
            return {
                "success": True,
                "statement_type": "DQL",
                "rows_affected": len(result),
                "columns": columns,
                "data": result,
                "engine": DB_STATUS["engine"],
                "is_fallback": DB_STATUS["is_fallback"]
            }
        else:
            conn.commit()
            rows_affected = cursor.rowcount if cursor.rowcount >= 0 else 0
            # Identify statement type
            st_upper = query.split()[0].upper() if query.split() else "SQL"
            stmt_kind = "DDL" if st_upper in ("CREATE", "ALTER", "DROP", "TRUNCATE") else "DML"
            return {
                "success": True,
                "statement_type": stmt_kind,
                "rows_affected": rows_affected,
                "columns": [],
                "data": [],
                "engine": DB_STATUS["engine"],
                "is_fallback": DB_STATUS["is_fallback"]
            }
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        # Clean error message without exposing connection credentials
        err_msg = str(e)
        if Config.ORACLE_PASSWORD in err_msg:
            err_msg = err_msg.replace(Config.ORACLE_PASSWORD, "******")
        return {
            "success": False,
            "error": err_msg,
            "engine": DB_STATUS["engine"],
            "is_fallback": DB_STATUS["is_fallback"]
        }
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass


def get_db_status():
    """Returns current active database connection health and driver info."""
    # Test connection once
    try:
        conn, eng = get_connection()
        conn.close()
    except Exception as e:
        DB_STATUS["connected"] = False
        DB_STATUS["last_error"] = str(e)
    return DB_STATUS
