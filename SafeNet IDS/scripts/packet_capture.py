import sqlite3
import os
from datetime import datetime, timedelta
from collections import defaultdict
import threading
import time

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'ids_database.db')

try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False
    print("Warning: Scapy not installed. Install with: pip install scapy")

class PacketCapture:
    def __init__(self, interface=None, packet_callback=None):
        self.interface = interface
        self.packet_callback = packet_callback
        self.is_running = False
        self.packet_count = 0
        self.capture_thread = None
        
    def parse_packet(self, packet):
        """Extract relevant information from packet"""
        if not IP in packet:
            return None
            
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        protocol = packet[IP].proto
        src_port = None
        dst_port = None
        flags = None
        packet_size = len(packet)
        
        protocol_name = 'IP'
        if TCP in packet:
            src_port = packet[TCP].sport
            dst_port = packet[TCP].dport
            protocol_name = 'TCP'
            flags = str(packet[TCP].flags)
        elif UDP in packet:
            src_port = packet[UDP].sport
            dst_port = packet[UDP].dport
            protocol_name = 'UDP'
        elif ICMP in packet:
            protocol_name = 'ICMP'
        
        return {
            'timestamp': datetime.now().isoformat(),
            'src_ip': src_ip,
            'dst_ip': dst_ip,
            'src_port': src_port,
            'dst_port': dst_port,
            'protocol': protocol_name,
            'packet_size': packet_size,
            'flags': flags or ''
        }
    
    def save_packet(self, packet_data):
        """Save packet to database"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO packets (timestamp, src_ip, dst_ip, src_port, dst_port, protocol, packet_size, flags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                packet_data['timestamp'],
                packet_data['src_ip'],
                packet_data['dst_ip'],
                packet_data['src_port'],
                packet_data['dst_port'],
                packet_data['protocol'],
                packet_data['packet_size'],
                packet_data['flags']
            ))
            conn.commit()
            conn.close()
            self.packet_count += 1
        except Exception as e:
            print(f"Error saving packet: {e}")
    
    def packet_callback_handler(self, packet):
        """Handle incoming packet"""
        packet_data = self.parse_packet(packet)
        if packet_data:
            self.save_packet(packet_data)
            if self.packet_callback:
                self.packet_callback(packet_data)
    
    def start_capture(self, interface=None, filter_str=""):
        """Start packet capture"""
        if not SCAPY_AVAILABLE:
            print("Scapy is required for packet capture")
            return False
        
        self.is_running = True
        print(f"Starting packet capture on interface: {interface or 'default'}")
        print(f"Filter: {filter_str or 'none'}")
        
        try:
            sniff(
                iface=interface,
                prn=self.packet_callback_handler,
                store=False,
                filter=filter_str,
                stop_filter=lambda x: not self.is_running
            )
        except PermissionError:
            print("Error: Packet capture requires elevated privileges (run with sudo)")
            self.is_running = False
            return False
        except Exception as e:
            print(f"Error during packet capture: {e}")
            self.is_running = False
            return False
        
        return True
    
    def stop_capture(self):
        """Stop packet capture"""
        self.is_running = False
        print("Packet capture stopped")
    
    def get_recent_packets(self, limit=100):
        """Get recent packets from database"""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM packets 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            packets = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return packets
        except Exception as e:
            print(f"Error fetching packets: {e}")
            return []
    
    def cleanup_old_packets(self, hours=24):
        """Remove packets older than specified hours"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cutoff_time = datetime.now() - timedelta(hours=hours)
            cursor.execute('DELETE FROM packets WHERE timestamp < ?', (cutoff_time.isoformat(),))
            conn.commit()
            deleted = cursor.rowcount
            conn.close()
            print(f"Deleted {deleted} old packets")
            return deleted
        except Exception as e:
            print(f"Error cleaning up packets: {e}")
            return 0

# Simulate packet data for demo/testing
def generate_simulated_packets(callback=None):
    """Generate simulated packet data for testing"""
    import random
    
    common_ips = [
        '192.168.1.100', '192.168.1.101', '192.168.1.102',
        '10.0.0.50', '10.0.0.51', '172.16.0.1',
        '8.8.8.8', '1.1.1.1', '45.33.32.156', '198.41.0.4'
    ]
    
    protocols = ['TCP', 'UDP', 'ICMP']
    
    while True:
        packet_data = {
            'timestamp': datetime.now().isoformat(),
            'src_ip': random.choice(common_ips),
            'dst_ip': random.choice(common_ips),
            'src_port': random.randint(1024, 65535),
            'dst_port': random.choice([80, 443, 22, 21, 25, 3306, 5432, 27017]),
            'protocol': random.choice(protocols),
            'packet_size': random.randint(64, 1500),
            'flags': random.choice(['SYN', 'ACK', 'FIN', 'RST', 'PSH', ''])
        }
        
        if callback:
            callback(packet_data)
        
        time.sleep(random.uniform(0.1, 0.5))
