from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import os
from datetime import datetime, timedelta
import threading
import asyncio

from packet_capture import PacketCapture, generate_simulated_packets
from detection_rules import DetectionRulesEngine
from init_db import init_database

# Initialize database
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'ids_database.db')
if not os.path.exists(DB_PATH):
    init_database()

app = FastAPI(title="SafeNet IDS API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
packet_capture = PacketCapture()
detection_engine = DetectionRulesEngine()
capture_thread = None
is_running = False

# Pydantic models
class PacketData(BaseModel):
    src_ip: str
    dst_ip: str
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    protocol: str
    packet_size: int
    flags: Optional[str] = None

class AlertData(BaseModel):
    alert_type: str
    severity: str
    src_ip: str
    dst_ip: Optional[str] = None
    message: str

class DetectionRule(BaseModel):
    rule_name: str
    rule_type: str
    threshold: int
    time_window: int
    severity: str
    description: Optional[str] = None

class IPListItem(BaseModel):
    ip_address: str
    reason: Optional[str] = None
    description: Optional[str] = None

class StatisticsData(BaseModel):
    total_packets: int
    total_alerts: int
    suspicious_ips: int
    critical_alerts: int
    alerts_by_type: dict

# Helper functions
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def dict_from_row(row):
    return dict(row) if row else None

# Routes

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": os.path.exists(DB_PATH),
        "capture_running": is_running
    }

@app.get("/packets")
async def get_packets(limit: int = 100, offset: int = 0):
    """Get recent packets"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM packets 
            ORDER BY timestamp DESC 
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        packets = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"packets": packets, "count": len(packets)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts")
async def get_alerts(limit: int = 100, offset: int = 0, severity: Optional[str] = None):
    """Get alerts with optional severity filter"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if severity:
            cursor.execute('''
                SELECT * FROM alerts 
                WHERE severity = ? 
                ORDER BY timestamp DESC 
                LIMIT ? OFFSET ?
            ''', (severity, limit, offset))
        else:
            cursor.execute('''
                SELECT * FROM alerts 
                ORDER BY timestamp DESC 
                LIMIT ? OFFSET ?
            ''', (limit, offset))
        
        alerts = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"alerts": alerts, "count": len(alerts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/logs")
async def get_logs(limit: int = 100, offset: int = 0, event_type: Optional[str] = None, src_ip: Optional[str] = None):
    """Get logs with optional filtering"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM logs WHERE 1=1"
        params = []
        
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)
        if src_ip:
            query += " AND src_ip = ?"
            params.append(src_ip)
        
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        logs = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"logs": logs, "count": len(logs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rules")
async def get_rules():
    """Get all detection rules"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM detection_rules ORDER BY id")
        rules = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"rules": rules}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rules/{rule_id}")
async def update_rule(rule_id: int, rule_data: dict):
    """Update a detection rule"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if 'enabled' in rule_data:
            cursor.execute('UPDATE detection_rules SET enabled = ? WHERE id = ?', (rule_data['enabled'], rule_id))
        if 'threshold' in rule_data:
            cursor.execute('UPDATE detection_rules SET threshold = ? WHERE id = ?', (rule_data['threshold'], rule_id))
        if 'severity' in rule_data:
            cursor.execute('UPDATE detection_rules SET severity = ? WHERE id = ?', (rule_data['severity'], rule_id))
        
        conn.commit()
        conn.close()
        detection_engine.load_rules()  # Reload rules
        
        return {"message": "Rule updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/blacklist")
async def get_blacklist():
    """Get blacklist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM blacklist ORDER BY added_at DESC")
        blacklist = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"blacklist": blacklist}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/blacklist")
async def add_to_blacklist(item: IPListItem):
    """Add IP to blacklist"""
    try:
        detection_engine.add_to_blacklist(item.ip_address, item.reason)
        return {"message": f"IP {item.ip_address} added to blacklist"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/blacklist/{ip_address}")
async def remove_from_blacklist(ip_address: str):
    """Remove IP from blacklist"""
    try:
        detection_engine.remove_from_blacklist(ip_address)
        return {"message": f"IP {ip_address} removed from blacklist"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/whitelist")
async def get_whitelist():
    """Get whitelist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM whitelist ORDER BY added_at DESC")
        whitelist = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"whitelist": whitelist}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/whitelist")
async def add_to_whitelist(item: IPListItem):
    """Add IP to whitelist"""
    try:
        detection_engine.add_to_whitelist(item.ip_address, item.description)
        return {"message": f"IP {item.ip_address} added to whitelist"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/whitelist/{ip_address}")
async def remove_from_whitelist(ip_address: str):
    """Remove IP from whitelist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM whitelist WHERE ip_address = ?", (ip_address,))
        conn.commit()
        conn.close()
        detection_engine.load_whitelist()
        return {"message": f"IP {ip_address} removed from whitelist"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_statistics() -> StatisticsData:
    """Get network statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total packets
        cursor.execute("SELECT COUNT(*) as count FROM packets WHERE timestamp > datetime('now', '-1 hour')")
        total_packets = cursor.fetchone()['count']
        
        # Get total alerts
        cursor.execute("SELECT COUNT(*) as count FROM alerts WHERE timestamp > datetime('now', '-1 hour')")
        total_alerts = cursor.fetchone()['count']
        
        # Get critical alerts
        cursor.execute("SELECT COUNT(*) as count FROM alerts WHERE severity = 'critical' AND timestamp > datetime('now', '-1 hour')")
        critical_alerts = cursor.fetchone()['count']
        
        # Get suspicious IPs
        cursor.execute("SELECT COUNT(DISTINCT src_ip) as count FROM alerts WHERE timestamp > datetime('now', '-1 hour')")
        suspicious_ips = cursor.fetchone()['count']
        
        # Get alerts by type
        cursor.execute('''
            SELECT alert_type, COUNT(*) as count FROM alerts 
            WHERE timestamp > datetime('now', '-1 hour')
            GROUP BY alert_type
        ''')
        alerts_by_type = {row['alert_type']: row['count'] for row in cursor.fetchall()}
        
        conn.close()
        
        return StatisticsData(
            total_packets=total_packets,
            total_alerts=total_alerts,
            suspicious_ips=suspicious_ips,
            critical_alerts=critical_alerts,
            alerts_by_type=alerts_by_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/capture/start")
async def start_capture(interface: Optional[str] = None, use_simulation: bool = True):
    """Start packet capture"""
    global is_running, capture_thread
    
    if is_running:
        raise HTTPException(status_code=400, detail="Capture already running")
    
    is_running = True
    
    def capture_worker():
        global is_running
        if use_simulation:
            print("Starting simulated packet capture")
            generate_simulated_packets(callback=analyze_packet)
        else:
            print(f"Starting real packet capture on {interface or 'default'}")
            packet_capture.start_capture(interface)
    
    capture_thread = threading.Thread(target=capture_worker, daemon=True)
    capture_thread.start()
    
    return {"message": "Packet capture started", "mode": "simulation" if use_simulation else "real"}

@app.post("/capture/stop")
async def stop_capture():
    """Stop packet capture"""
    global is_running
    is_running = False
    packet_capture.stop_capture()
    return {"message": "Packet capture stopped"}

def analyze_packet(packet_data):
    """Analyze packet and generate alerts"""
    alerts = detection_engine.analyze_packet(packet_data)
    return alerts

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
