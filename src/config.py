import os
import sys

# Determine if running in a PyInstaller bundle
if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    BASE_DIR = sys._MEIPASS
    # Store database in Windows Local AppData or Unix home dir to keep the desktop clean
    if os.name == 'nt':
        appdata = os.environ.get('LOCALAPPDATA') or os.path.expanduser('~')
    else:
        appdata = os.path.expanduser('~')
    DATA_DIR = os.path.join(appdata, "AssetManagementSystem")
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR = BASE_DIR

# Ensure DATA_DIR directory exists
os.makedirs(DATA_DIR, exist_ok=True)

DB_FILE = os.path.join(DATA_DIR, "asset_management.db")

TEMP_DUE_ALERT_DAYS = 1
LOW_STOCK_THRESHOLD = 3
