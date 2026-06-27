import os
import io
import sqlite3
from datetime import datetime, date
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_file

from src.config import BASE_DIR, LOW_STOCK_THRESHOLD, TEMP_DUE_ALERT_DAYS
from src.database import sql_fetchall, sql_execute, db, db_lock
from src.security import hash_password, verify_password

app = Flask(__name__, 
            template_folder=os.path.join(BASE_DIR, 'templates'),
            static_folder=os.path.join(BASE_DIR, 'static'))

def get_int_param(data, key, default=None):
    if not data:
        return default
    if isinstance(data, dict):
        val = data.get(key)
        if val is None:
            return default
        try:
            return int(val)
        except (ValueError, TypeError):
            return default
    return data.get(key, default, type=int)

# ---------------- STATIC UI PAGES ----------------
@app.route('/')
def index():
    return render_template('index.html')

# ---------------- AUTH API ----------------
@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'success': False, 'error': 'Missing credentials'}), 400

    row = sql_fetchall("SELECT password FROM users WHERE username=?", (username,))
    if not row or not verify_password(password, row[0]['password']):
        return jsonify({'success': False, 'error': 'Invalid username or password'}), 401

    return jsonify({'success': True, 'username': username})

@app.route('/api/auth/change_password', methods=['POST'])
def api_change_password():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    old_pw = data.get('old_password', '').strip()
    new_pw = data.get('new_password', '').strip()

    if not username or not old_pw or not new_pw:
        return jsonify({'success': False, 'error': 'All fields are required'}), 400

    row = sql_fetchall("SELECT password FROM users WHERE username=?", (username,))
    if not row or not verify_password(old_pw, row[0]['password']):
        return jsonify({'success': False, 'error': 'Current password incorrect'}), 401

    sql_execute("UPDATE users SET password=? WHERE username=?", (hash_password(new_pw), username))
    return jsonify({'success': True})

# ---------------- WORKSPACES API ----------------
@app.route('/api/workspaces', methods=['GET'])
def api_get_workspaces():
    rows = sql_fetchall("SELECT id, name, is_main FROM workspaces WHERE is_archived=0 ORDER BY is_main DESC")
    return jsonify([dict(r) for r in rows])

@app.route('/api/workspaces', methods=['POST'])
def api_create_workspace():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'success': False, 'error': 'Workspace name required'}), 400

    try:
        wid = sql_execute("INSERT INTO workspaces(name, is_main, is_archived) VALUES(?, 0, 0)", (name,))
        return jsonify({'success': True, 'workspace_id': wid})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'error': 'Workspace already exists'}), 409

@app.route('/api/workspaces/rename', methods=['POST'])
def api_rename_workspace():
    data = request.get_json() or {}
    workspace_id = get_int_param(data, 'workspace_id')
    new_name = data.get('name', '').strip()

    if not workspace_id or not new_name:
        return jsonify({'success': False, 'error': 'Workspace ID and new name required'}), 400

    ws = sql_fetchall("SELECT is_main FROM workspaces WHERE id=?", (workspace_id,))
    if not ws:
        return jsonify({'success': False, 'error': 'Workspace not found'}), 404
    if ws[0]['is_main']:
        return jsonify({'success': False, 'error': 'Main workspace cannot be renamed'}), 403

    try:
        sql_execute("UPDATE workspaces SET name=? WHERE id=?", (new_name, workspace_id))
        return jsonify({'success': True})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'error': 'Workspace name already exists'}), 409
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/workspaces/<int:workspace_id>', methods=['DELETE'])
def api_delete_workspace(workspace_id):
    # Check main workspace deletion prevention
    ws = sql_fetchall("SELECT is_main FROM workspaces WHERE id=?", (workspace_id,))
    if not ws:
        return jsonify({'success': False, 'error': 'Workspace not found'}), 404
    if ws[0]['is_main']:
        return jsonify({'success': False, 'error': 'Main workspace cannot be deleted'}), 403

    # Check active assets
    active = sql_fetchall("SELECT COUNT(*) FROM issued_products WHERE workspace_id=? AND returned=0", (workspace_id,))[0][0]
    if active > 0:
        return jsonify({'success': False, 'error': 'Cannot delete workspace with active assets'}), 400

    sql_execute("DELETE FROM issued_products WHERE workspace_id=?", (workspace_id,))
    sql_execute("DELETE FROM ewaste WHERE workspace_id=?", (workspace_id,))
    sql_execute("DELETE FROM products WHERE workspace_id=?", (workspace_id,))
    sql_execute("DELETE FROM workspaces WHERE id=?", (workspace_id,))
    return jsonify({'success': True})

# ---------------- PRODUCTS API ----------------
@app.route('/api/products', methods=['GET'])
def api_get_products():
    workspace_id = request.args.get('workspace_id', type=int)
    if workspace_id is None:
        return jsonify({'success': False, 'error': 'Workspace ID required'}), 400

    rows = sql_fetchall("SELECT id, name, model, quantity FROM products WHERE workspace_id=?", (workspace_id,))
    return jsonify([dict(r) for r in rows])

@app.route('/api/products', methods=['POST'])
def api_add_product():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    model = data.get('model', '').strip()
    workspace_id = get_int_param(data, 'workspace_id')

    if not name or not model or workspace_id is None:
        return jsonify({'success': False, 'error': 'Missing product name, model, or workspace'}), 400

    try:
        qty = int(data.get('quantity', 0))
        if qty <= 0:
            raise ValueError
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid quantity'}), 400

    existing = sql_fetchall("SELECT id, quantity FROM products WHERE name=? AND model=? AND workspace_id=?", (name, model, workspace_id))
    if existing:
        product_id, old_qty = existing[0]
        sql_execute("UPDATE products SET quantity=? WHERE id=?", (old_qty + qty, product_id))
    else:
        sql_execute("INSERT INTO products(name, model, quantity, workspace_id) VALUES(?, ?, ?, ?)", (name, model, qty, workspace_id))

    return jsonify({'success': True})

@app.route('/api/products/edit', methods=['POST', 'PUT'])
def api_edit_product():
    data = request.get_json() or {}
    product_id = get_int_param(data, 'id')
    name = data.get('name', '').strip()
    model = data.get('model', '').strip()
    try:
        qty = int(data.get('quantity', 0))
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid quantity'}), 400

    if not product_id or not name or not model:
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400

    sql_execute("UPDATE products SET name=?, model=?, quantity=? WHERE id=?", (name, model, qty, product_id))
    return jsonify({'success': True})

@app.route('/api/products/transfer', methods=['POST'])
def api_transfer_product():
    data = request.get_json() or {}
    product_id = get_int_param(data, 'product_id')
    target_workspace_id = get_int_param(data, 'target_workspace_id')
    
    if not product_id or not target_workspace_id:
        return jsonify({'success': False, 'error': 'Missing source product or target workspace'}), 400

    prod = sql_fetchall("SELECT name, model, quantity, workspace_id FROM products WHERE id=?", (product_id,))
    if not prod:
        return jsonify({'success': False, 'error': 'Product not found'}), 404

    name, model, qty, src_workspace_id = prod[0]

    existing = sql_fetchall("SELECT id FROM products WHERE name=? AND model=? AND workspace_id=?", (name, model, target_workspace_id))
    if existing:
        sql_execute("UPDATE products SET quantity=quantity+? WHERE id=?", (qty, existing[0]['id']))
    else:
        sql_execute("INSERT INTO products(name, model, quantity, workspace_id) VALUES(?, ?, ?, ?)", (name, model, qty, target_workspace_id))

    sql_execute("DELETE FROM products WHERE id=?", (product_id,))
    return jsonify({'success': True})

@app.route('/api/products/delete', methods=['POST', 'DELETE'])
def api_delete_product():
    data = request.get_json() or request.args
    product_id = get_int_param(data, 'id')

    if not product_id:
        return jsonify({'success': False, 'error': 'Product ID required'}), 400

    active = sql_fetchall("SELECT COUNT(*) FROM issued_products WHERE product_id=? AND returned=0", (product_id,))[0][0]
    if active > 0:
        return jsonify({'success': False, 'error': 'Cannot delete product with active issued assets'}), 400

    sql_execute("DELETE FROM issued_products WHERE product_id=?", (product_id,))
    sql_execute("DELETE FROM products WHERE id=?", (product_id,))
    return jsonify({'success': True})

# ---------------- ASSET LOGS & SEARCH API ----------------
@app.route('/api/assets/search', methods=['GET'])
def api_search_assets():
    workspace_id = request.args.get('workspace_id', type=int)
    filter_choice = request.args.get('filter', 'Newest First')
    search_term = request.args.get('search', '').strip()
    page = request.args.get('page', 0, type=int)
    limit = request.args.get('limit', 200, type=int)
    offset = page * limit

    base_query = """
        FROM issued_products i
        LEFT JOIN products p ON i.product_id = p.id
        LEFT JOIN workspaces w ON i.workspace_id = w.id
    """
    conditions = []
    params = []

    if workspace_id is not None:
        is_main = False
        ws_row = sql_fetchall("SELECT is_main FROM workspaces WHERE id=?", (workspace_id,))
        if ws_row and ws_row[0]['is_main']:
            is_main = True
        if not is_main:
            conditions.append("i.workspace_id=?")
            params.append(workspace_id)

    if filter_choice == "Only Active":
        conditions.append("i.returned=0")
    elif filter_choice == "Only Returned":
        conditions.append("i.returned=1")

    if search_term:
        like = f"%{search_term}%"
        conditions.append("""(
            i.serial_no LIKE ?
            OR i.recipient_id LIKE ?
            OR i.recipient LIKE ?
            OR i.department LIKE ?
            OR p.name LIKE ?
            OR p.model LIKE ?
        )""")
        params.extend([like, like, like, like, like, like])

    if conditions:
        base_query += " WHERE " + " AND ".join(conditions)

    # Count
    count_row = sql_fetchall("SELECT COUNT(*) " + base_query, tuple(params))
    total_rows = count_row[0][0]

    # Sort
    order = "ASC" if filter_choice == "Oldest First" else "DESC"

    # Query Data
    data_query = f"""
        SELECT
            i.id,
            i.serial_no,
            p.name as product_name,
            p.model as product_model,
            i.recipient,
            i.recipient_id,
            i.department,
            i.type,
            i.start_date,
            i.end_date,
            i.returned,
            i.return_date,
            i.remark
        {base_query}
        ORDER BY i.start_date {order}
        LIMIT ? OFFSET ?
    """

    final_params = params.copy()
    final_params.extend([limit, offset])
    rows = sql_fetchall(data_query, tuple(final_params))

    # Format Status
    today = date.today()
    results = []
    for r in rows:
        d = dict(r)
        status = "Returned" if d['returned'] else "Active"
        if d['type'] == 'Temporary' and not d['returned'] and d['end_date']:
            try:
                due = datetime.strptime(d['end_date'], "%Y-%m-%d").date()
                if due < today:
                    status = "OVERDUE"
            except:
                pass
        d['status'] = status
        results.append(d)

    return jsonify({
        'total_rows': total_rows,
        'page': page,
        'limit': limit,
        'rows': results
    })

@app.route('/api/assets/issue', methods=['POST'])
def api_issue_asset():
    data = request.get_json() or {}
    product_id = get_int_param(data, 'product_id')
    recipient = data.get('recipient', '').strip()
    recipient_id = data.get('recipient_id', '').strip()
    department = data.get('department', '').strip()
    asset_type = data.get('type', 'Permanent').strip()
    start_date = data.get('start_date', '').strip()
    end_date = data.get('end_date', '').strip() or None
    serial = data.get('serial_no', '').strip()
    workspace_id = get_int_param(data, 'workspace_id')

    if not serial or not recipient or not recipient_id or not product_id or workspace_id is None:
        return jsonify({'success': False, 'error': 'Missing required issue details'}), 400

    # Duplicate check
    existing = sql_fetchall("SELECT id FROM issued_products WHERE serial_no=? AND returned=0", (serial,))
    if existing:
        return jsonify({'success': False, 'error': 'Serial number already actively issued'}), 400

    try:
        with db_lock:
            with db.conn:
                cur = db.conn.cursor()
                stock = cur.execute("SELECT quantity FROM products WHERE id=?", (product_id,)).fetchone()
                if not stock or stock[0] <= 0:
                    return jsonify({'success': False, 'error': 'Product is out of stock'}), 400

                cur.execute("""
                    INSERT INTO issued_products
                    (product_id, recipient, recipient_id, department, type, start_date, end_date, serial_no, returned, workspace_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
                """, (product_id, recipient, recipient_id, department, asset_type, start_date, end_date, serial, workspace_id))

                cur.execute("UPDATE products SET quantity = quantity - 1 WHERE id=? AND quantity > 0", (product_id,))

        return jsonify({'success': True})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'error': 'Database constraint violation (duplicate serial)'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/assets/return', methods=['POST'])
def api_return_asset():
    data = request.get_json() or {}
    manual = data.get('manual_return', False)
    return_date_val = data.get('return_date', date.today().isoformat()).strip()
    remark = data.get('remark', '').strip()
    damaged_ewaste = data.get('damaged_ewaste', False)
    workspace_id = get_int_param(data, 'workspace_id')

    if workspace_id is None:
        return jsonify({'success': False, 'error': 'Workspace ID required'}), 400

    if manual:
        serial = data.get('serial_no', '').strip()
        emp = data.get('recipient', '').strip()
        dept = data.get('department', '').strip()
        product_id = get_int_param(data, 'product_id')

        if not serial or not emp or not product_id:
            return jsonify({'success': False, 'error': 'Missing manual return info'}), 400

        prod = sql_fetchall("SELECT name, model FROM products WHERE id=?", (product_id,))
        if not prod:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        pname, pmodel = prod[0]

        try:
            if not damaged_ewaste:
                sql_execute("UPDATE products SET quantity = quantity + 1 WHERE id=?", (product_id,))

            sql_execute("""
                INSERT INTO issued_products
                (product_id, recipient, recipient_id, department, type, start_date, end_date, serial_no, returned, return_date, remark, workspace_id)
                VALUES (?, ?, '', ?, 'Manual Return', ?, NULL, ?, 1, ?, ?, ?)
            """, (product_id, emp, dept, return_date_val, serial, return_date_val, remark, workspace_id))

            if damaged_ewaste:
                sql_execute("""
                    INSERT INTO ewaste (name, model, serial_no, ewaste_date, remark, workspace_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (pname, pmodel, serial, return_date_val, remark or "Manual Return (E-Waste)", workspace_id))

            return jsonify({'success': True})
        except sqlite3.IntegrityError:
            return jsonify({'success': False, 'error': 'Asset serial already exists in workspace.'}), 400

    else:
        issue_id = get_int_param(data, 'issue_id')
        if not issue_id:
            return jsonify({'success': False, 'error': 'Issue ID required'}), 400

        row = sql_fetchall("SELECT returned, product_id, serial_no FROM issued_products WHERE id=?", (issue_id,))
        if not row:
            return jsonify({'success': False, 'error': 'Asset log not found'}), 404
        returned, product_id, serial = row[0]
        if returned == 1:
            return jsonify({'success': False, 'error': 'Asset already returned'}), 400

        sql_execute("UPDATE issued_products SET returned=1, return_date=?, remark=? WHERE id=?", (return_date_val, remark, issue_id))

        if damaged_ewaste:
            prod = sql_fetchall("SELECT name, model FROM products WHERE id=?", (product_id,))
            pname, pmodel = prod[0] if prod else ("Unknown", "Unknown")
            sql_execute("""
                INSERT INTO ewaste (name, model, serial_no, ewaste_date, remark, workspace_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (pname, pmodel, serial, return_date_val, remark, workspace_id))
        else:
            sql_execute("UPDATE products SET quantity = quantity + 1 WHERE id=?", (product_id,))

        return jsonify({'success': True})

@app.route('/api/assets/delete', methods=['POST', 'DELETE'])
def api_delete_asset():
    data = request.get_json() or request.args
    issue_id = get_int_param(data, 'issue_id')
    if not issue_id:
        return jsonify({'success': False, 'error': 'Issue ID required'}), 400

    row = sql_fetchall("SELECT product_id, returned FROM issued_products WHERE id=?", (issue_id,))
    if not row:
        return jsonify({'success': False, 'error': 'Record not found'}), 404
    product_id, returned = row[0]

    if returned == 0:
        sql_execute("UPDATE products SET quantity = quantity + 1 WHERE id=?", (product_id,))

    sql_execute("DELETE FROM issued_products WHERE id=?", (issue_id,))
    return jsonify({'success': True})

@app.route('/api/assets/history', methods=['GET'])
def api_asset_history():
    serial = request.args.get('serial_no', '').strip()
    if not serial:
        return jsonify({'success': False, 'error': 'Serial number required'}), 400

    rows = sql_fetchall("""
        SELECT start_date AS date, 'Issued' AS action, recipient AS user, department, '' AS remark
        FROM issued_products WHERE serial_no=?
        UNION ALL
        SELECT return_date AS date, 'Returned' AS action, recipient AS user, department, remark
        FROM issued_products WHERE serial_no=? AND returned=1
        ORDER BY 1
    """, (serial, serial))
    return jsonify([dict(r) for r in rows])

@app.route('/api/assets/autofill', methods=['GET'])
def api_autofill():
    key = request.args.get('key', '').strip()
    if not key:
        return jsonify([])

    rows = sql_fetchall("""
        SELECT i.id, i.product_id, i.serial_no, p.name, p.model, i.recipient, i.department, i.start_date, i.type
        FROM issued_products i
        JOIN products p ON i.product_id = p.id
        WHERE i.returned = 0 AND (i.serial_no=? OR i.recipient_id=?)
    """, (key, key))
    return jsonify([dict(r) for r in rows])

# ---------------- OVERDUE, EWASTE, RETURNS API ----------------
@app.route('/api/assets/overdue', methods=['GET'])
def api_overdue_assets():
    workspace_id = request.args.get('workspace_id', type=int)
    today_str = date.today().isoformat()

    is_main = False
    if workspace_id:
        ws_row = sql_fetchall("SELECT is_main FROM workspaces WHERE id=?", (workspace_id,))
        if ws_row and ws_row[0]['is_main']:
            is_main = True

    if workspace_id is None or workspace_id == 0 or is_main:
        rows = sql_fetchall("""
            SELECT i.serial_no, p.name, p.model, i.recipient, i.recipient_id, i.department, i.start_date, i.end_date
            FROM issued_products i
            JOIN products p ON i.product_id=p.id
            WHERE i.returned=0 AND i.type='Temporary' AND i.end_date IS NOT NULL AND i.end_date < ?
            ORDER BY i.end_date ASC
        """, (today_str,))
    else:
        rows = sql_fetchall("""
            SELECT i.serial_no, p.name, p.model, i.recipient, i.recipient_id, i.department, i.start_date, i.end_date
            FROM issued_products i
            JOIN products p ON i.product_id=p.id
            WHERE i.returned=0 AND i.type='Temporary' AND i.end_date IS NOT NULL AND i.end_date < ? AND i.workspace_id=?
            ORDER BY i.end_date ASC
        """, (today_str, workspace_id))

    return jsonify([dict(r) for r in rows])

@app.route('/api/ewaste', methods=['GET'])
def api_get_ewaste():
    rows = sql_fetchall("""
        SELECT e.id, e.name, e.model, e.serial_no, e.ewaste_date, e.remark, w.name as workspace_name
        FROM ewaste e
        LEFT JOIN workspaces w ON e.workspace_id = w.id
        ORDER BY e.ewaste_date DESC
    """)
    return jsonify([dict(r) for r in rows])

@app.route('/api/ewaste/delete', methods=['POST', 'DELETE'])
def api_delete_ewaste():
    data = request.get_json() or request.args
    ewaste_id = get_int_param(data, 'id')
    if not ewaste_id:
        return jsonify({'success': False, 'error': 'Ewaste ID required'}), 400

    sql_execute("DELETE FROM ewaste WHERE id=?", (ewaste_id,))
    return jsonify({'success': True})

@app.route('/api/ewaste/restore', methods=['POST'])
def api_restore_ewaste():
    data = request.get_json() or {}
    ewaste_id = get_int_param(data, 'id')
    if not ewaste_id:
        return jsonify({'success': False, 'error': 'Ewaste ID required'}), 400

    row = sql_fetchall("SELECT name, model, serial_no, workspace_id FROM ewaste WHERE id=?", (ewaste_id,))
    if not row:
        return jsonify({'success': False, 'error': 'E-Waste record not found'}), 404
    name, model, serial, workspace_id = row[0]

    prod = sql_fetchall("SELECT id FROM products WHERE name=? AND model=? AND workspace_id=?", (name, model, workspace_id))
    if prod:
        sql_execute("UPDATE products SET quantity = quantity + 1 WHERE id=?", (prod[0]['id'],))
    else:
        sql_execute("INSERT INTO products(name, model, quantity, workspace_id) VALUES(?, ?, 1, ?)", (name, model, workspace_id))

    sql_execute("DELETE FROM ewaste WHERE id=?", (ewaste_id,))
    return jsonify({'success': True})

@app.route('/api/returns', methods=['GET'])
def api_get_returns():
    rows = sql_fetchall("""
        SELECT i.serial_no, p.name, p.model, i.recipient, i.department, i.return_date, i.type
        FROM issued_products i
        JOIN products p ON i.product_id = p.id
        WHERE i.returned = 1
        ORDER BY i.return_date DESC
    """)
    return jsonify([dict(r) for r in rows])

# ---------------- REPORTS & ALERTS API ----------------
@app.route('/api/reports/stats', methods=['GET'])
def api_get_reports_stats():
    total_assets = sql_fetchall("SELECT COUNT(*) FROM issued_products")[0][0]
    active_assets = sql_fetchall("SELECT COUNT(*) FROM issued_products WHERE returned=0")[0][0]
    returned_assets = sql_fetchall("SELECT COUNT(*) FROM issued_products WHERE returned=1")[0][0]

    top_products = sql_fetchall("""
        SELECT p.name, COUNT(*) as usage_count
        FROM issued_products i
        JOIN products p ON i.product_id = p.id
        GROUP BY p.name
        ORDER BY usage_count DESC
        LIMIT 10
    """)

    return jsonify({
        'total': total_assets,
        'active': active_assets,
        'returned': returned_assets,
        'top_products': [dict(r) for r in top_products]
    })

@app.route('/api/alerts', methods=['GET'])
def api_get_alerts():
    workspace_id = request.args.get('workspace_id', type=int)
    today = date.today()
    
    is_main = False
    if workspace_id:
        ws_row = sql_fetchall("SELECT is_main FROM workspaces WHERE id=?", (workspace_id,))
        if ws_row and ws_row[0]['is_main']:
            is_main = True

    if workspace_id is None or workspace_id == 0 or is_main:
        # Low stock across all workspaces
        low_stock = sql_fetchall(
            "SELECT name, model, quantity FROM products WHERE quantity<=? AND quantity>0",
            (LOW_STOCK_THRESHOLD,)
        )

        # Temporary assets due across all workspaces
        temp_due = sql_fetchall("""
            SELECT i.serial_no, i.recipient, i.recipient_id, i.end_date, w.name as workspace_name
            FROM issued_products i
            LEFT JOIN workspaces w ON i.workspace_id = w.id
            WHERE i.returned=0
            AND i.type='Temporary'
            AND i.end_date IS NOT NULL
        """)
    else:
        # Low stock within workspace_id
        low_stock = sql_fetchall(
            "SELECT name, model, quantity FROM products WHERE quantity<=? AND quantity>0 AND workspace_id=?",
            (LOW_STOCK_THRESHOLD, workspace_id)
        )

        # Temporary assets due within workspace_id
        temp_due = sql_fetchall("""
            SELECT i.serial_no, i.recipient, i.recipient_id, i.end_date, w.name as workspace_name
            FROM issued_products i
            LEFT JOIN workspaces w ON i.workspace_id = w.id
            WHERE i.returned=0
            AND i.type='Temporary'
            AND i.end_date IS NOT NULL
            AND i.workspace_id=?
        """, (workspace_id,))

    due_alerts = []
    for r in temp_due:
        d = dict(r)
        try:
            due = datetime.strptime(d['end_date'], "%Y-%m-%d").date()
            delta = (due - today).days
            if delta <= TEMP_DUE_ALERT_DAYS:
                d['delta'] = delta
                d['status'] = "DUE TODAY" if delta == 0 else ("OVERDUE" if delta < 0 else "DUE SOON")
                due_alerts.append(d)
        except:
            continue

    return jsonify({
        'low_stock': [dict(r) for r in low_stock],
        'due_alerts': due_alerts
    })

# ---------------- EXCEL IMPORT / EXPORT API ----------------
@app.route('/api/excel/import', methods=['POST'])
def api_import_excel():
    workspace_id = request.form.get('workspace_id', type=int)
    if workspace_id is None:
        return jsonify({'success': False, 'error': 'Workspace ID required'}), 400

    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400

    f = request.files['file']
    if not f or not f.filename.endswith('.xlsx'):
        return jsonify({'success': False, 'error': 'Please upload an .xlsx Excel file'}), 400

    try:
        df = pd.read_excel(f)
        required_cols = {
            "Product", "Model", "Serial",
            "User", "Emp ID", "Dept",
            "Type", "Issue Date", "Return Date"
        }

        if not required_cols.issubset(df.columns):
            return jsonify({'success': False, 'error': f'Invalid column structures. Must contain: {", ".join(required_cols)}'}), 400

        for _, r in df.iterrows():
            prod = sql_fetchall(
                "SELECT id FROM products WHERE name=? AND model=? AND workspace_id=?",
                (r["Product"], r["Model"], workspace_id)
            )

            if prod:
                product_id = prod[0][0]
            else:
                product_id = sql_execute(
                    "INSERT INTO products(name,model,quantity,workspace_id) VALUES(?,?,0,?)",
                    (r["Product"], r["Model"], workspace_id)
                )

            try:
                sql_execute("""
                    INSERT INTO issued_products
                    (product_id, recipient, recipient_id, department, type,
                     start_date, end_date, serial_no, returned, workspace_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
                """, (
                    product_id,
                    r["User"],
                    r["Emp ID"],
                    r["Dept"],
                    r["Type"],
                    str(r["Issue Date"])[:10],
                    str(r["Return Date"])[:10] if pd.notna(r["Return Date"]) else None,
                    r["Serial"],
                    workspace_id
                ))
            except sqlite3.IntegrityError:
                continue

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to process Excel: {str(e)}'}), 500

@app.route('/api/excel/export')
def api_export_excel():
    workspace_id = request.args.get('workspace_id', type=int)
    filter_choice = request.args.get('filter', 'Newest First')
    search_term = request.args.get('search', '').strip()

    base_query = """
        FROM issued_products i
        LEFT JOIN products p ON i.product_id = p.id
        LEFT JOIN workspaces w ON i.workspace_id = w.id
    """
    conditions = []
    params = []

    if workspace_id is not None:
        is_main = False
        ws_row = sql_fetchall("SELECT is_main FROM workspaces WHERE id=?", (workspace_id,))
        if ws_row and ws_row[0]['is_main']:
            is_main = True
        if not is_main:
            conditions.append("i.workspace_id=?")
            params.append(workspace_id)

    if filter_choice == "Only Active":
        conditions.append("i.returned=0")
    elif filter_choice == "Only Returned":
        conditions.append("i.returned=1")

    if search_term:
        like = f"%{search_term}%"
        conditions.append("""(
            i.serial_no LIKE ?
            OR i.recipient_id LIKE ?
            OR i.recipient LIKE ?
            OR i.department LIKE ?
            OR p.name LIKE ?
            OR p.model LIKE ?
        )""")
        params.extend([like, like, like, like, like, like])

    if conditions:
        base_query += " WHERE " + " AND ".join(conditions)

    order = "ASC" if filter_choice == "Oldest First" else "DESC"

    data_query = f"""
        SELECT
            i.serial_no as [Serial],
            p.name as [Product],
            p.model as [Model],
            i.recipient as [User],
            i.recipient_id as [Emp ID],
            i.department as [Dept],
            i.type as [Type],
            i.start_date as [Issued],
            CASE WHEN i.returned=1 THEN i.return_date ELSE i.end_date END as [Return/Due],
            CASE WHEN i.returned=1 THEN 'Returned' ELSE 'Active' END as [Status],
            i.remark as [Remark]
        {base_query}
        ORDER BY i.start_date {order}
    """

    rows = sql_fetchall(data_query, tuple(params))
    df = pd.DataFrame([dict(r) for r in rows])

    # Build spreadsheet in-memory
    output = io.BytesIO()
    try:
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Assets')
            worksheet = writer.sheets['Assets']
            for column in worksheet.columns:
                length = max(len(str(cell.value or '')) for cell in column)
                worksheet.column_dimensions[column[0].column_letter].width = length + 3
        output.seek(0)
        return send_file(
            output,
            as_attachment=True,
            download_name='assets_export.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Server instantiation wrapper
def create_app():
    return app
