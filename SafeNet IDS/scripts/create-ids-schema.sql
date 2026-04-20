-- SafeNet IDS Database Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Packets table - stores captured network packets
CREATE TABLE IF NOT EXISTS packets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_ip INET NOT NULL,
  destination_ip INET NOT NULL,
  source_port INTEGER,
  destination_port INTEGER,
  protocol VARCHAR(10),
  packet_size INTEGER,
  flags VARCHAR(20),
  payload TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packets_timestamp ON packets (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_packets_source_ip ON packets (source_ip);
CREATE INDEX IF NOT EXISTS idx_packets_dest_ip ON packets (destination_ip);

-- Alerts table - security alerts triggered by detection rules
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  source_ip INET NOT NULL,
  destination_ip INET NOT NULL,
  description TEXT,
  detection_rule VARCHAR(100),
  packet_count INTEGER DEFAULT 1,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_source_ip ON alerts (source_ip);

-- IP Blacklist table
CREATE TABLE IF NOT EXISTS ip_blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL UNIQUE,
  reason VARCHAR(255),
  threat_level VARCHAR(20) CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IP Whitelist table
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detection Rules table
CREATE TABLE IF NOT EXISTS detection_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  rule_type VARCHAR(50) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  threshold_value INTEGER,
  time_window_seconds INTEGER,
  severity VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Port Scan Events table - tracks potential port scanning attempts
CREATE TABLE IF NOT EXISTS port_scan_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_ip INET NOT NULL,
  ports_accessed INTEGER[] NOT NULL,
  port_count INTEGER NOT NULL,
  destination_ip INET,
  time_window_seconds INTEGER DEFAULT 60,
  is_threat BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_port_scan_source_ip ON port_scan_events (source_ip);
CREATE INDEX IF NOT EXISTS idx_port_scan_created_at ON port_scan_events (created_at DESC);

-- DoS Detection Events table
CREATE TABLE IF NOT EXISTS dos_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_ip INET NOT NULL,
  packet_count INTEGER NOT NULL,
  bytes_sent INTEGER,
  time_window_seconds INTEGER DEFAULT 10,
  target_ip INET,
  is_threat BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dos_source_ip ON dos_events (source_ip);
CREATE INDEX IF NOT EXISTS idx_dos_created_at ON dos_events (created_at DESC);

-- Protocol Anomalies table
CREATE TABLE IF NOT EXISTS protocol_anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_ip INET NOT NULL,
  protocol VARCHAR(10),
  anomaly_type VARCHAR(100),
  description TEXT,
  severity VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protocol_anomaly_source_ip ON protocol_anomalies (source_ip);
CREATE INDEX IF NOT EXISTS idx_protocol_anomaly_created_at ON protocol_anomalies (created_at DESC);

-- Geolocation data for IPs
CREATE TABLE IF NOT EXISTS ip_geolocation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET NOT NULL UNIQUE,
  country VARCHAR(100),
  city VARCHAR(100),
  latitude FLOAT,
  longitude FLOAT,
  is_vpn BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Network Statistics (aggregated hourly)
CREATE TABLE IF NOT EXISTS network_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hour TIMESTAMP WITH TIME ZONE NOT NULL,
  total_packets INTEGER DEFAULT 0,
  total_bytes INTEGER DEFAULT 0,
  unique_sources INTEGER DEFAULT 0,
  unique_destinations INTEGER DEFAULT 0,
  protocol_counts JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hour)
);

-- System Configuration
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT,
  config_type VARCHAR(20),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default detection rules
INSERT INTO detection_rules (rule_name, rule_type, description, enabled, threshold_value, time_window_seconds, severity)
VALUES
  ('port_scan_detection', 'port_scan', 'Detects rapid port scanning attempts', TRUE, 10, 60, 'warning'),
  ('dos_attack_detection', 'dos', 'Detects denial of service attacks', TRUE, 1000, 10, 'critical'),
  ('blacklist_check', 'blacklist', 'Flags connections from blacklisted IPs', TRUE, 1, 0, 'critical'),
  ('protocol_anomaly', 'protocol', 'Detects unusual protocol patterns', TRUE, 5, 300, 'warning'),
  ('geographic_anomaly', 'geographic', 'Flags connections from unexpected geographic locations', TRUE, 1, 0, 'warning')
ON CONFLICT (rule_name) DO NOTHING;

-- Insert default system config
INSERT INTO system_config (config_key, config_value, config_type)
VALUES
  ('capture_enabled', 'true', 'boolean'),
  ('alert_threshold_critical', '1', 'integer'),
  ('alert_threshold_warning', '5', 'integer'),
  ('data_retention_days', '30', 'integer')
ON CONFLICT (config_key) DO NOTHING;
