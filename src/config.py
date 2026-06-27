import os
import sys

# Determine if running in a PyInstaller bundle
if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    BASE_DIR = sys._MEIPASS
    DATA_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR = BASE_DIR

DB_FILE = os.path.join(DATA_DIR, "asset_management.db")

TEMP_DUE_ALERT_DAYS = 1
LOW_STOCK_THRESHOLD = 3
