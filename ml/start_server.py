#!/usr/bin/env python3
"""
Script to start the AgriAssist inference server
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def check_port(port):
    """Check if a port is in use"""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def main():
    # Get the project root directory
    project_root = Path(__file__).resolve().parent.parent
    ml_dir = project_root / "ml"
    
    print("🚀 Starting AgriAssist Inference Server")
    print(f"📁 Project root: {project_root}")
    print(f"📁 ML directory: {ml_dir}")
    
    # Check if server is already running
    if check_port(8000):
        print("✅ Inference server is already running on port 8000")
        return
    
    # Change to the ml directory
    os.chdir(ml_dir)
    
    # Check if required files exist
    infer_server_py = ml_dir / "infer_server.py"
    if not infer_server_py.exists():
        print(f"❌ Error: infer_server.py not found at {infer_server_py}")
        return
    
    # Check if virtual environment exists
    venv_dirs = [ml_dir / "venv", ml_dir / ".venv"]
    venv_found = False
    for venv_dir in venv_dirs:
        if venv_dir.exists():
            venv_found = True
            print(f"✅ Virtual environment found at {venv_dir}")
            break
    
    if not venv_found:
        print("⚠️  No virtual environment found. Make sure dependencies are installed.")
    
    # Start the server
    print("📦 Starting inference server...")
    try:
        # Use uvicorn to start the server
        cmd = [
            sys.executable, "-m", "uvicorn", 
            "infer_server:app", 
            "--host", "0.0.0.0", 
            "--port", "8000"
        ]
        
        print(f"🔧 Command: {' '.join(cmd)}")
        
        # Start the process
        process = subprocess.Popen(cmd)
        
        # Wait a bit and check if it started
        time.sleep(3)
        
        if check_port(8000):
            print("✅ Inference server started successfully on port 8000")
            print("   Access the API at: http://localhost:8000")
            print("   Health check: http://localhost:8000/health")
            print("   Press Ctrl+C to stop the server")
            
            # Keep the process running
            try:
                process.wait()
            except KeyboardInterrupt:
                print("\n🛑 Stopping inference server...")
                process.terminate()
                process.wait()
                print("✅ Inference server stopped")
        else:
            print("❌ Failed to start inference server")
            process.terminate()
            
    except Exception as e:
        print(f"❌ Error starting inference server: {e}")

if __name__ == "__main__":
    main()