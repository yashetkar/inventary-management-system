import threading
from datetime import date
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
from .security import hash_password

# Load environment variables from .env if present
load_dotenv()

# Global lock for thread‑safety
db_lock = threading.Lock()

# Build MySQL connection URL from environment variables
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_NAME = os.getenv('DB_NAME')

if DB_NAME:
    # MySQL connection
    engine = create_engine(
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=10,
        max_overflow=20,
        echo=False,
        future=True,
    )
else:
    # Fallback to SQLite using local DB file
    from .config import DB_FILE
    engine = create_engine(f"sqlite:///{DB_FILE}", connect_args={"check_same_thread": False})



class DictLikeRow:
    def __init__(self, row):
        self._row = row
        self._mapping = row._mapping

    def __getitem__(self, key):
        if isinstance(key, (int, slice)):
            return self._row[key]
        return self._mapping[key]

    def keys(self):
        return self._mapping.keys()

    def values(self):
        return self._row

    def items(self):
        return self._mapping.items()

    def __iter__(self):
        return iter(self._row)

    def __len__(self):
        return len(self._row)

    def __repr__(self):
        return repr(dict(self._mapping))

    def __contains__(self, key):
        return key in self._mapping


def sql_fetchall(query, params=()):
    """Execute a SELECT query and return all rows as a list of DictLikeRow objects."""
    # Convert placeholders only for MySQL connections
    if engine.name != 'sqlite':
        query = query.replace('?', '%s')
    with db_lock:
        with engine.connect() as conn:
            result = conn.exec_driver_sql(query, params)
            return [DictLikeRow(row) for row in result.all()]


def sql_execute(query, params=()):
    """Execute an INSERT/UPDATE/DELETE query and return the last inserted id if available."""
    # Convert placeholders only for MySQL connections
    if engine.name != 'sqlite':
        query = query.replace('?', '%s')
    with db_lock:
        with engine.begin() as conn:
            result = conn.exec_driver_sql(query, params)
            # For INSERT statements, return the generated primary key if any
            try:
                return result.lastrowid
            except Exception:
                return None


def init_db():
    """Create tables if they do not exist. Uses the same schema as the original SQLite version."""
    if engine.name == 'sqlite':
        with engine.begin() as conn:
            # Users table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(255) UNIQUE,
                password VARCHAR(255)
            )
            """))
            # Workspaces table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS workspaces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) UNIQUE,
                is_main TINYINT,
                is_archived TINYINT
            )
            """))
            # Products table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255),
                model VARCHAR(255),
                quantity INT CHECK (quantity >= 0),
                min_stock_alert INT DEFAULT 5,
                workspace_id INTEGER,
                is_archived TINYINT DEFAULT 0,
                UNIQUE(name, model, workspace_id),
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
            )
            """))
            
            # SQLite safe check for workspace_id and min_stock_alert
            table_info = conn.execute(text("PRAGMA table_info(products)")).all()
            cols = [c[1] for c in table_info]
            if "workspace_id" not in cols:
                conn.execute(text("ALTER TABLE products ADD COLUMN workspace_id INTEGER"))
            if "is_archived" not in cols:
                conn.execute(text("ALTER TABLE products ADD COLUMN is_archived TINYINT DEFAULT 0"))
            if "min_stock_alert" not in cols:
                conn.execute(text("ALTER TABLE products ADD COLUMN min_stock_alert INT DEFAULT 5"))

            # Issued products table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS issued_products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER,
                recipient VARCHAR(255),
                recipient_id VARCHAR(255),
                department VARCHAR(255),
                type VARCHAR(50),
                start_date DATE,
                end_date DATE,
                serial_no VARCHAR(255),
                returned TINYINT DEFAULT 0,
                return_date DATE,
                remark TEXT,
                workspace_id INTEGER,
                specification TEXT,
                UNIQUE(serial_no, workspace_id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
            """))
            
            # SQLite safe check for specification
            table_info_issued = conn.execute(text("PRAGMA table_info(issued_products)")).all()
            cols_issued = [c[1] for c in table_info_issued]
            if "specification" not in cols_issued:
                conn.execute(text("ALTER TABLE issued_products ADD COLUMN specification TEXT"))

            # Ewaste table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ewaste (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255),
                model VARCHAR(255),
                serial_no VARCHAR(255),
                ewaste_date DATE,
                remark TEXT,
                workspace_id INTEGER,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
            )
            """))

            # Product Serials table for auto-detected imported serials
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS product_serials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER,
                serial_no VARCHAR(255),
                is_issued TINYINT DEFAULT 0,
                workspace_id INTEGER,
                UNIQUE(serial_no, workspace_id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
            """))

            # Asset Transfers table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS asset_transfers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                issue_id INTEGER,
                serial_no VARCHAR(255),
                from_recipient VARCHAR(255),
                from_recipient_id VARCHAR(255),
                from_department VARCHAR(255),
                to_recipient VARCHAR(255),
                to_recipient_id VARCHAR(255),
                to_department VARCHAR(255),
                transfer_date DATE,
                remark TEXT,
                workspace_id INTEGER,
                FOREIGN KEY (issue_id) REFERENCES issued_products(id)
            )
            """))

            # Default admin user
            admin_exists = conn.execute(text("SELECT 1 FROM users WHERE username='admin'")).fetchone()
            if not admin_exists:
                conn.execute(text("INSERT INTO users (username, password) VALUES (:username, :pwd)"), {
                    "username": "admin",
                    "pwd": hash_password("admin123")
                })
            # Default main workspace
            main_exists = conn.execute(text("SELECT 1 FROM workspaces WHERE is_main=1")).fetchone()
            if not main_exists:
                conn.execute(text("INSERT INTO workspaces (name, is_main, is_archived) VALUES (:name, 1, 0)"), {"name": "Main Inventory"})
            # Backfill workspace_id for products without one
            main_ws_row = conn.execute(text("SELECT id FROM workspaces WHERE is_main=1")).fetchone()
            if main_ws_row:
                main_ws_id = main_ws_row[0]
                conn.execute(text("UPDATE products SET workspace_id=:ws WHERE workspace_id IS NULL"), {"ws": main_ws_id})

            # Indexes
            index_statements = [
                "CREATE INDEX IF NOT EXISTS idx_product_return ON issued_products(product_id, returned)",
                "CREATE INDEX IF NOT EXISTS idx_workspace_product ON products(workspace_id, id)",
                "CREATE INDEX IF NOT EXISTS idx_search_recipient ON issued_products(recipient)",
                "CREATE INDEX IF NOT EXISTS idx_products_workspace ON products(workspace_id)",
                "CREATE INDEX IF NOT EXISTS idx_issued_workspace ON issued_products(workspace_id)",
                "CREATE INDEX IF NOT EXISTS idx_issued_returned ON issued_products(returned)",
                "CREATE INDEX IF NOT EXISTS idx_issued_serial ON issued_products(serial_no)",
                "CREATE INDEX IF NOT EXISTS idx_emp ON issued_products(recipient_id)",
                "CREATE INDEX IF NOT EXISTS idx_start_date ON issued_products(start_date)",
                "CREATE INDEX IF NOT EXISTS idx_products_lookup ON products(name, model, workspace_id)",
                "CREATE INDEX IF NOT EXISTS idx_returned_workspace ON issued_products(returned, workspace_id)",
                "CREATE INDEX IF NOT EXISTS idx_product_workspace ON products(id, workspace_id)",
                "CREATE INDEX IF NOT EXISTS idx_search_combo ON issued_products(serial_no, recipient_id, returned)",
                "CREATE INDEX IF NOT EXISTS idx_transfers_serial ON asset_transfers(serial_no)",
                "CREATE INDEX IF NOT EXISTS idx_transfers_issue ON asset_transfers(issue_id)"
            ]
            for stmt in index_statements:
                conn.execute(text(stmt))
    else:
        # MySQL implementation
        with engine.begin() as conn:
            # Users table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(255) UNIQUE,
                password VARCHAR(255)
            )
            """))
            # Workspaces table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS workspaces (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) UNIQUE,
                is_main TINYINT,
                is_archived TINYINT
            )
            """))
            # Products table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255),
                model VARCHAR(255),
                quantity INT CHECK (quantity >= 0),
                min_stock_alert INT DEFAULT 5,
                workspace_id INTEGER,
                is_archived TINYINT DEFAULT 0,
                UNIQUE(name, model, workspace_id),
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
            )
            """))
            
            try:
                conn.execute(text("ALTER TABLE products ADD COLUMN workspace_id INTEGER"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE products ADD COLUMN is_archived TINYINT DEFAULT 0"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE products ADD COLUMN min_stock_alert INT DEFAULT 5"))
            except Exception:
                pass

            # Issued products table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS issued_products (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                product_id INTEGER,
                recipient VARCHAR(255),
                recipient_id VARCHAR(255),
                department VARCHAR(255),
                type VARCHAR(50),
                start_date DATE,
                end_date DATE,
                serial_no VARCHAR(255),
                returned TINYINT DEFAULT 0,
                return_date DATE,
                remark TEXT,
                workspace_id INTEGER,
                specification TEXT,
                UNIQUE(serial_no, workspace_id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
            """))

            try:
                conn.execute(text("ALTER TABLE issued_products ADD COLUMN specification TEXT"))
            except Exception:
                pass

            # Ewaste table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ewaste (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255),
                model VARCHAR(255),
                serial_no VARCHAR(255),
                ewaste_date DATE,
                remark TEXT,
                workspace_id INTEGER,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
            )
            """))

            # Product Serials table for auto-detected imported serials
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS product_serials (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                product_id INTEGER,
                serial_no VARCHAR(255),
                is_issued TINYINT DEFAULT 0,
                workspace_id INTEGER,
                UNIQUE(serial_no, workspace_id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
            """))

            # Asset Transfers table
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS asset_transfers (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                issue_id INTEGER,
                serial_no VARCHAR(255),
                from_recipient VARCHAR(255),
                from_recipient_id VARCHAR(255),
                from_department VARCHAR(255),
                to_recipient VARCHAR(255),
                to_recipient_id VARCHAR(255),
                to_department VARCHAR(255),
                transfer_date DATE,
                remark TEXT,
                workspace_id INTEGER,
                FOREIGN KEY (issue_id) REFERENCES issued_products(id)
            )
            """))

            # Default admin user
            admin_exists = conn.execute(text("SELECT 1 FROM users WHERE username='admin'")).fetchone()
            if not admin_exists:
                conn.execute(text("INSERT INTO users (username, password) VALUES (:username, :pwd)"), {
                    "username": "admin",
                    "pwd": hash_password("admin123")
                })
            # Default main workspace
            main_exists = conn.execute(text("SELECT 1 FROM workspaces WHERE is_main=1")).fetchone()
            if not main_exists:
                conn.execute(text("INSERT INTO workspaces (name, is_main, is_archived) VALUES (:name, 1, 0)"), {"name": "Main Inventory"})
            # Backfill workspace_id for products without one
            main_ws_row = conn.execute(text("SELECT id FROM workspaces WHERE is_main=1")).fetchone()
            if main_ws_row:
                main_ws_id = main_ws_row[0]
                conn.execute(text("UPDATE products SET workspace_id=:ws WHERE workspace_id IS NULL"), {"ws": main_ws_id})

            # Indexes for MySQL
            index_definitions = [
                ("idx_product_return", "issued_products(product_id, returned)"),
                ("idx_workspace_product", "products(workspace_id, id)"),
                ("idx_search_recipient", "issued_products(recipient)"),
                ("idx_products_workspace", "products(workspace_id)"),
                ("idx_issued_workspace", "issued_products(workspace_id)"),
                ("idx_issued_returned", "issued_products(returned)"),
                ("idx_issued_serial", "issued_products(serial_no)"),
                ("idx_emp", "issued_products(recipient_id)"),
                ("idx_start_date", "issued_products(start_date)"),
                ("idx_products_lookup", "products(name, model, workspace_id)"),
                ("idx_returned_workspace", "issued_products(returned, workspace_id)"),
                ("idx_product_workspace", "products(id, workspace_id)"),
                ("idx_search_combo", "issued_products(serial_no, recipient_id, returned)"),
                ("idx_transfers_serial", "asset_transfers(serial_no)"),
                ("idx_transfers_issue", "asset_transfers(issue_id)")
            ]
            for idx_name, col_def in index_definitions:
                try:
                    conn.execute(text(f"CREATE INDEX {idx_name} ON {col_def}"))
                except Exception:
                    pass

def reset_database():
    """Wipe all tables and re-initialize schema and default data."""
    with db_lock:
        with engine.begin() as conn:
            if engine.name == 'sqlite':
                conn.execute(text("PRAGMA foreign_keys = OFF;"))
                conn.execute(text("DROP TABLE IF EXISTS asset_transfers;"))
                conn.execute(text("DROP TABLE IF EXISTS issued_products;"))
                conn.execute(text("DROP TABLE IF EXISTS ewaste;"))
                conn.execute(text("DROP TABLE IF EXISTS product_serials;"))
                conn.execute(text("DROP TABLE IF EXISTS products;"))
                conn.execute(text("DROP TABLE IF EXISTS workspaces;"))
                conn.execute(text("DROP TABLE IF EXISTS users;"))
                conn.execute(text("PRAGMA foreign_keys = ON;"))
            else:
                conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
                conn.execute(text("DROP TABLE IF EXISTS asset_transfers;"))
                conn.execute(text("DROP TABLE IF EXISTS issued_products;"))
                conn.execute(text("DROP TABLE IF EXISTS ewaste;"))
                conn.execute(text("DROP TABLE IF EXISTS product_serials;"))
                conn.execute(text("DROP TABLE IF EXISTS products;"))
                conn.execute(text("DROP TABLE IF EXISTS workspaces;"))
                conn.execute(text("DROP TABLE IF EXISTS users;"))
                conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
    init_db()
