import os
import socket
from src.database import init_db
from src.web_app import create_app

def get_local_ip():
    try:
        # Create a dummy socket to detect primary local IP address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

if __name__ == "__main__":
    # Ensure database schema is initialized
    init_db()
    
    # Run the Flask app on all interfaces (0.0.0.0) on a static port (default 5000)
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    app = create_app()
    local_ip = get_local_ip()
    
    print("\n" + "="*60)
    print("      ASSET MANAGEMENT SYSTEM - SERVER STARTED")
    print("="*60)
    print(f" Local Address:   http://127.0.0.1:{port}")
    if local_ip != "127.0.0.1":
        print(f" Network Address: http://{local_ip}:{port}")
        print(f" (Other PCs on the same network can access it using the Network Address)")
    print("="*60)
    print("Press Ctrl+C to stop the server.\n")
    
    app.run(host=host, port=port, debug=False, use_reloader=False)
