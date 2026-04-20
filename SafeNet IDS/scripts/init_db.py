import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'ids_database.db')

def init_database():
    """Initialize the IDS database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create packets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS packets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            src_ip TEXT NOT NULL,
            dst_ip TEXT NOT NULL,
            src_port INTEGER,
            dst_port INTEGER,
            protocol TEXT,
            packet_size INTEGER,
            flags TEXT,
            payload TEXT
        )
    ''')
    
    # Create alerts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            alert_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            src_ip TEXT NOT NULL,
            dst_ip TEXT,
            message TEXT,
            packet_count INTEGER DEFAULT 1,
            rule_id INTEGER,
            resolved BOOLEAN DEFAULT 0
        )
    ''')
    
    # Create logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            event_type TEXT NOT NULL,
            src_ip TEXT NOT NULL,
            dst_ip TEXT,
            port INTEGER,
            description TEXT,
            severity TEXT DEFAULT 'low'
        )
    ''')
    
    # Create blacklist table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS blacklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT UNIQUE NOT NULL,
            reason TEXT,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME
        )
    ''')
    
    # Create whitelist table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS whitelist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT UNIQUE NOT NULL,
            description TEXT,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create detection rules table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS detection_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_name TEXT UNIQUE NOT NULL,
            rule_type TEXT NOT NULL,
            enabled BOOLEAN DEFAULT 1,
            threshold INTEGER,
            time_window INTEGER,
            severity TEXT DEFAULT 'medium',
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create port scan events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS port_scan_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            src_ip TEXT NOT NULL,
            ports_accessed TEXT NOT NULL,
            port_count INTEGER,
            alert_id INTEGER
        )
    ''')
    
    # Create DoS events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dos_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            src_ip TEXT NOT NULL,
            dst_ip TEXT,
            packet_count INTEGER,
            alert_id INTEGER
        )
    ''')
    
    # Create protocol anomalies table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS protocol_anomalies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            src_ip TEXT NOT NULL,
            protocol TEXT,
            anomaly_type TEXT,
            severity TEXT,
            alert_id INTEGER
        )
    ''')
    
    # Create geolocation data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS geolocation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT UNIQUE NOT NULL,
            country TEXT,
            city TEXT,
            latitude REAL,
            longitude REAL,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create network statistics table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS network_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            total_packets INTEGER DEFAULT 0,
            total_alerts INTEGER DEFAULT 0,
            suspicious_ips INTEGER DEFAULT 0,
            protocols_detected TEXT
        )
    ''')
    
    # Insert default detection rules
    default_rules = [
        ('Port Scanning Detection', 'port_scan', 1, 5, 30, 'high', 'Alert when one IP accesses >5 ports in <30s'),
        ('DoS Attack Detection', 'dos', 1, 1000, 10, 'critical', 'Alert when single IP sends >1000 packets in <10s'),
        ('Blacklist Checking', 'blacklist', 1, 1, 0, 'high', 'Flag traffic from blacklisted IPs'),
        ('Whitelist Checking', 'whitelist', 1, 1, 0, 'medium', 'Flag non-whitelisted connections'),
        ('Protocol Anomalies', 'protocol_anomaly', 1, 1, 0, 'medium', 'Detect unusual protocol patterns'),
        ('Geographic Anomalies', 'geo_anomaly', 1, 1, 0, 'medium', 'Flag unexpected geographic connections'),
    ]
    
    for rule in default_rules:
        try:
            cursor.execute('''
                INSERT INTO detection_rules (rule_name, rule_type, enabled, threshold, time_window, severity, description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', rule)
        except sqlite3.IntegrityError:
            pass  # Rule already exists
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

if __name__ == '__main__':
    init_database()
