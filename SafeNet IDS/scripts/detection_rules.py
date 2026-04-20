import sqlite3
import os
from datetime import datetime, timedelta
from collections import defaultdict
import ipaddress

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'ids_database.db')

class DetectionRulesEngine:
    def __init__(self):
        self.packet_buffer = defaultdict(list)
        self.port_scan_buffer = defaultdict(set)
        self.load_blacklist()
        self.load_whitelist()
        self.load_rules()
    
    def load_rules(self):
        """Load detection rules from database"""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM detection_rules WHERE enabled = 1')
            self.rules = {row['rule_type']: dict(row) for row in cursor.fetchall()}
            conn.close()
        except Exception as e:
            print(f"Error loading rules: {e}")
            self.rules = {}
    
    def load_blacklist(self):
        """Load blacklisted IPs from database"""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT ip_address FROM blacklist WHERE expires_at IS NULL OR expires_at > datetime("now")')
            self.blacklist = {row['ip_address'] for row in cursor.fetchall()}
            conn.close()
        except Exception as e:
            print(f"Error loading blacklist: {e}")
            self.blacklist = set()
    
    def load_whitelist(self):
        """Load whitelisted IPs from database"""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT ip_address FROM whitelist')
            self.whitelist = {row['ip_address'] for row in cursor.fetchall()}
            conn.close()
        except Exception as e:
            print(f"Error loading whitelist: {e}")
            self.whitelist = set()
    
    def add_to_blacklist(self, ip_address, reason=None, expires_at=None):
        """Add IP to blacklist"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR IGNORE INTO blacklist (ip_address, reason, expires_at)
                VALUES (?, ?, ?)
            ''', (ip_address, reason, expires_at))
            conn.commit()
            conn.close()
            self.blacklist.add(ip_address)
            return True
        except Exception as e:
            print(f"Error adding to blacklist: {e}")
            return False
    
    def remove_from_blacklist(self, ip_address):
        """Remove IP from blacklist"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM blacklist WHERE ip_address = ?', (ip_address,))
            conn.commit()
            conn.close()
            self.blacklist.discard(ip_address)
            return True
        except Exception as e:
            print(f"Error removing from blacklist: {e}")
            return False
    
    def add_to_whitelist(self, ip_address, description=None):
        """Add IP to whitelist"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR IGNORE INTO whitelist (ip_address, description)
                VALUES (?, ?)
            ''', (ip_address, description))
            conn.commit()
            conn.close()
            self.whitelist.add(ip_address)
            return True
        except Exception as e:
            print(f"Error adding to whitelist: {e}")
            return False
    
    def create_alert(self, alert_type, severity, src_ip, dst_ip=None, message='', rule_id=None):
        """Create an alert in the database"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO alerts (alert_type, severity, src_ip, dst_ip, message, rule_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (alert_type, severity, src_ip, dst_ip, message, rule_id))
            conn.commit()
            alert_id = cursor.lastrowid
            conn.close()
            return alert_id
        except Exception as e:
            print(f"Error creating alert: {e}")
            return None
    
    def detect_port_scan(self, packet):
        """Detect port scanning attacks"""
        if 'port_scan' not in self.rules or not self.rules['port_scan'].get('enabled'):
            return None
        
        rule = self.rules['port_scan']
        src_ip = packet['src_ip']
        dst_port = packet['dst_port']
        
        if dst_port:
            self.port_scan_buffer[src_ip].add(dst_port)
        
        # Check if threshold exceeded
        if len(self.port_scan_buffer[src_ip]) > rule['threshold']:
            ports = ','.join(map(str, sorted(self.port_scan_buffer[src_ip])))
            message = f"Port scanning detected: accessed {len(self.port_scan_buffer[src_ip])} ports"
            alert_id = self.create_alert(
                'port_scan', 
                rule['severity'], 
                src_ip, 
                message=message,
                rule_id=rule['id']
            )
            self.port_scan_buffer[src_ip].clear()
            return alert_id
        
        return None
    
    def detect_dos_attack(self, packet):
        """Detect DoS attacks based on packet rate"""
        if 'dos' not in self.rules or not self.rules['dos'].get('enabled'):
            return None
        
        rule = self.rules['dos']
        src_ip = packet['src_ip']
        current_time = datetime.fromisoformat(packet['timestamp'])
        
        # Buffer packets from this source
        self.packet_buffer[src_ip].append({
            'timestamp': current_time,
            'packet': packet
        })
        
        # Clean old packets outside time window
        time_threshold = current_time - timedelta(seconds=rule['time_window'])
        self.packet_buffer[src_ip] = [
            p for p in self.packet_buffer[src_ip] 
            if p['timestamp'] > time_threshold
        ]
        
        # Check if threshold exceeded
        if len(self.packet_buffer[src_ip]) > rule['threshold']:
            message = f"DoS attack detected: {len(self.packet_buffer[src_ip])} packets in {rule['time_window']}s"
            alert_id = self.create_alert(
                'dos',
                rule['severity'],
                src_ip,
                message=message,
                rule_id=rule['id']
            )
            self.packet_buffer[src_ip].clear()
            return alert_id
        
        return None
    
    def detect_blacklist_violation(self, packet):
        """Check if packet is from blacklisted IP"""
        if 'blacklist' not in self.rules or not self.rules['blacklist'].get('enabled'):
            return None
        
        src_ip = packet['src_ip']
        rule = self.rules['blacklist']
        
        if src_ip in self.blacklist:
            message = f"Traffic from blacklisted IP: {src_ip}"
            alert_id = self.create_alert(
                'blacklist_violation',
                rule['severity'],
                src_ip,
                packet.get('dst_ip'),
                message=message,
                rule_id=rule['id']
            )
            return alert_id
        
        return None
    
    def detect_whitelist_violation(self, packet):
        """Check if packet destination is not whitelisted"""
        if 'whitelist' not in self.rules or not self.rules['whitelist'].get('enabled'):
            return None
        
        dst_ip = packet.get('dst_ip')
        rule = self.rules['whitelist']
        
        if dst_ip and self.whitelist and dst_ip not in self.whitelist:
            message = f"Connection to non-whitelisted IP: {dst_ip}"
            alert_id = self.create_alert(
                'whitelist_violation',
                rule['severity'],
                packet['src_ip'],
                dst_ip,
                message=message,
                rule_id=rule['id']
            )
            return alert_id
        
        return None
    
    def detect_protocol_anomaly(self, packet):
        """Detect unusual protocol patterns"""
        if 'protocol_anomaly' not in self.rules or not self.rules['protocol_anomaly'].get('enabled'):
            return None
        
        rule = self.rules['protocol_anomaly']
        
        # Detect unusual TCP flags combinations
        if packet['protocol'] == 'TCP' and packet['flags']:
            flags = packet['flags']
            # Check for suspicious flag combinations like FIN+SYN or RST+SYN
            suspicious_combos = ['SYN,FIN', 'RST,SYN', 'FIN,ACK,PSH']
            if any(combo in flags for combo in suspicious_combos):
                message = f"Anomalous TCP flags detected: {flags}"
                alert_id = self.create_alert(
                    'protocol_anomaly',
                    rule['severity'],
                    packet['src_ip'],
                    packet.get('dst_ip'),
                    message=message,
                    rule_id=rule['id']
                )
                return alert_id
        
        # Detect unusual packet sizes
        if packet['packet_size'] > 65000:
            message = f"Oversized packet detected: {packet['packet_size']} bytes"
            alert_id = self.create_alert(
                'protocol_anomaly',
                rule['severity'],
                packet['src_ip'],
                packet.get('dst_ip'),
                message=message,
                rule_id=rule['id']
            )
            return alert_id
        
        return None
    
    def detect_geo_anomaly(self, packet):
        """Detect unusual geographic patterns (stub for future enhancement)"""
        if 'geo_anomaly' not in self.rules or not self.rules['geo_anomaly'].get('enabled'):
            return None
        
        # This would require GeoIP database
        # For now, flag IPs from unusual ranges (VPN/Proxy indicators)
        src_ip = packet['src_ip']
        
        # Check for known VPN/Proxy ASNs (simplified example)
        if src_ip.startswith('107.') or src_ip.startswith('45.'):
            rule = self.rules['geo_anomaly']
            message = f"Connection from unusual geographic location: {src_ip}"
            alert_id = self.create_alert(
                'geo_anomaly',
                rule['severity'],
                src_ip,
                packet.get('dst_ip'),
                message=message,
                rule_id=rule['id']
            )
            return alert_id
        
        return None
    
    def analyze_packet(self, packet):
        """Analyze packet and return any triggered alerts"""
        alerts = []
        
        # Run all detection rules
        port_scan_alert = self.detect_port_scan(packet)
        if port_scan_alert:
            alerts.append(port_scan_alert)
        
        dos_alert = self.detect_dos_attack(packet)
        if dos_alert:
            alerts.append(dos_alert)
        
        blacklist_alert = self.detect_blacklist_violation(packet)
        if blacklist_alert:
            alerts.append(blacklist_alert)
        
        whitelist_alert = self.detect_whitelist_violation(packet)
        if whitelist_alert:
            alerts.append(whitelist_alert)
        
        protocol_alert = self.detect_protocol_anomaly(packet)
        if protocol_alert:
            alerts.append(protocol_alert)
        
        geo_alert = self.detect_geo_anomaly(packet)
        if geo_alert:
            alerts.append(geo_alert)
        
        return alerts
