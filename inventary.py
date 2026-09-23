import threading
import time
import socket
import webview
from src.database import init_db
from src.web_app import create_app

def find_free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port

port = find_free_port()
 
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def run_flask():
    app = create_app()
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
                                                              
if __name__ == "__main__":
    # Ensure database schema is initialized                                                                 
    init_db()
    
    # Start Flask server in a background daemon thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    
    # Wait for the Flask server to boot up
    time.sleep(1.2)
    
    # Launch pywebview native desktop application window
    webview.create_window(
        title="Asset Management System",
        url=f"http://127.0.0.1:{port}",
        width=1400,
        height=850,
        resizable=True,                                                                  
        min_size=(900, 600)                       
    )
    webview.start()                                                    