import sqlite3
import threading
from datetime import date
from .config import DB_FILE
from .security import hash_password

db_lock = threading.Lock()

sqlite3.register_adapter(date, lambda d: d.isoformat())

class Database:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(
            db_path,
            timeout=15,
            check_same_thread=False
        )
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL;")
        self.conn.execute("PRAGMA synchronous=NORMAL;")
        self.conn.execute("PRAGMA foreign_keys=ON;")
        self.conn.execute("PRAGMA temp_store=MEMORY;")
        self.conn.execute("PRAGMA cache_size=-50000;")  # 200MB cache
        self.conn.execute("PRAGMA busy_timeout=8000;")

    def fetchall(self, query, params=()):
        with db_lock:
            cur = self.conn.cursor()
            cur.execute(query, params)
            return cur.fetchall()

    def execute(self, query, params=()):
        with db_lock:
            with self.conn:
                cur = self.conn.cursor()
                cur.execute(query, params)
                return cur.lastrowid

db = Database(DB_FILE)

def sql_fetchall(query, params=()):
    return db.fetchall(query, params)

def sql_execute(query, params=()):
    return db.execute(query, params)

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA temp_store=MEMORY;")
        conn.execute("PRAGMA cache_size=100000;")
        conn.execute("PRAGMA foreign_keys=ON;")

        cur = conn.cursor()

        # ---------------- USERS ----------------
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT
        )
        """)

        # ---------------- WORKSPACES ----------------
        cur.execute("""
        CREATE TABLE IF NOT EXISTS workspaces(
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE,
            is_main INTEGER,
            is_archived INTEGER
        )
        """)

        # ---------------- PRODUCTS ----------------
        cur.execute("""
        CREATE TABLE IF NOT EXISTS products(
            id INTEGER PRIMARY KEY,
            name TEXT,
            model TEXT,
            quantity INTEGER CHECK(quantity >= 0),
            workspace_id INTEGER,
            UNIQUE(name, model, workspace_id),
            FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
        )
        """)

        # If workspace_id column missing (old DB), add it
        cols = [c[1] for c in cur.execute("PRAGMA table_info(products)")]
        if "workspace_id" not in cols:
            cur.execute("ALTER TABLE products ADD COLUMN workspace_id INTEGER")

        # ---------------- ISSUED ----------------
        cur.execute("""
        CREATE TABLE IF NOT EXISTS issued_products(
            id INTEGER PRIMARY KEY,
            product_id INTEGER,
            recipient TEXT,
            recipient_id TEXT,
            department TEXT,
            type TEXT,
            start_date TEXT,
            end_date TEXT,
            serial_no TEXT,
            returned INTEGER DEFAULT 0,
            return_date TEXT,
            remark TEXT,
            workspace_id INTEGER,
            UNIQUE(serial_no, workspace_id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
        """)

        # ---------------- EWASTE ----------------
        cur.execute("""
        CREATE TABLE IF NOT EXISTS ewaste(
            id INTEGER PRIMARY KEY,
            name TEXT,
            model TEXT,
            serial_no TEXT,
            ewaste_date TEXT,
            remark TEXT,
            workspace_id INTEGER,
            FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
        )
        """)

        # ---------------- DEFAULT DATA ----------------
        if not cur.execute("SELECT 1 FROM users").fetchone():
            cur.execute(
                "INSERT INTO users VALUES(NULL,'admin',?)",
                (hash_password("admin123"),)
            )

        if not cur.execute("SELECT 1 FROM workspaces WHERE is_main=1").fetchone():
            cur.execute(
                "INSERT INTO workspaces VALUES(NULL,'Main Inventory',1,0)"
            )

        # Backfill old products to Main workspace
        main_ws_row = cur.execute(
            "SELECT id FROM workspaces WHERE is_main=1"
        ).fetchone()
        if main_ws_row:
            main_ws = main_ws_row[0]
            cur.execute("""
                UPDATE products
                SET workspace_id=?
                WHERE workspace_id IS NULL
            """, (main_ws,))

        # Indexes
        cur.executescript("""
        CREATE INDEX IF NOT EXISTS idx_product_return
        ON issued_products(product_id, returned);

        CREATE INDEX IF NOT EXISTS idx_workspace_product
        ON products(workspace_id, id);

        CREATE INDEX IF NOT EXISTS idx_search_recipient
        ON issued_products(recipient);
        CREATE INDEX IF NOT EXISTS idx_products_workspace
        ON products(workspace_id);

        CREATE INDEX IF NOT EXISTS idx_issued_workspace
        ON issued_products(workspace_id);

        CREATE INDEX IF NOT EXISTS idx_issued_returned
        ON issued_products(returned);

        CREATE INDEX IF NOT EXISTS idx_issued_serial
        ON issued_products(serial_no);

        CREATE INDEX IF NOT EXISTS idx_emp
        ON issued_products(recipient_id);

        CREATE INDEX IF NOT EXISTS idx_start_date
        ON issued_products(start_date);

        CREATE INDEX IF NOT EXISTS idx_products_lookup
        ON products(name, model, workspace_id);
        CREATE INDEX IF NOT EXISTS idx_returned_workspace
        ON issued_products(returned, workspace_id);

        CREATE INDEX IF NOT EXISTS idx_product_workspace
        ON products(id, workspace_id);

        CREATE INDEX IF NOT EXISTS idx_search_combo
        ON issued_products(serial_no, recipient_id, returned);
        """)
