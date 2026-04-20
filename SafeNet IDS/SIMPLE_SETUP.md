# SafeNet IDS - Simple Setup & Usage Guide

## What Is This App?

SafeNet IDS is a **Network Intrusion Detection System** that monitors network traffic and detects threats in real-time. It simulates realistic packet capture and immediately generates security alerts when it detects suspicious activity.

## Start Using It (2 Steps)

### Step 1: Run the App
```bash
pnpm dev
```

Open http://localhost:3000 in your browser

### Step 2: Click "Start Capture"
Click the **"Start Capture"** button in the top right. The system will immediately begin generating realistic network traffic and security alerts.

## What Happens After You Click Start

The app will:
1. Generate simulated network packets (realistic traffic patterns)
2. Analyze each packet for threats using 6 detection rules
3. Display alerts in real-time on the dashboard
4. Store all data in Supabase database

**You'll see:**
- Packets appearing in real-time
- Security alerts with severity levels (critical, warning, info)
- Statistics updating (total packets, alerts, threat sources)
- Charts showing traffic patterns

## The 6 Detection Rules

The app automatically detects:

1. **Port Scanning** - When one IP tries multiple ports rapidly
2. **DoS Attacks** - When one IP sends too many packets
3. **Blacklist Matching** - Traffic from known bad IPs
4. **Protocol Anomalies** - Unusual TCP flags or oversized packets
5. **Geographic Anomalies** - Connections from unusual locations
6. **Whitelist Violations** - Connections to untrusted IPs

## Dashboard Overview

**Top Section:**
- Capture button (Start/Stop)
- Status indicator (shows if capture is running)

**Statistics (4 Cards):**
- Critical Alerts count
- Warning Alerts count
- Total Packets count
- Unique Threat Sources count

**Charts:**
- Real-time traffic visualization
- Top threat sources (most suspicious IPs)

**Alerts Table:**
- All detected threats
- Source/destination IPs
- Severity level
- When it happened
- Button to mark as resolved

## Common Actions

### View Real-Time Alerts
Just look at the "Recent Alerts" table - it updates automatically every 3 seconds while capturing.

### See Traffic Patterns
Look at the "Real-time Traffic" chart to see packets and alerts over time.

### Stop Capturing
Click the "Stop Capture" button (replaces the start button when capturing).

### Filter Alerts
Use the severity buttons above the alerts table to filter by critical, warning, or info.

## Data Persistence

All packets and alerts are stored in Supabase PostgreSQL database:
- Packets - every packet captured
- Alerts - every threat detected
- IP Lists - blacklist/whitelist entries
- Statistics - aggregated network stats

## Understanding the Data

**Alert Severity:**
- **CRITICAL (Red)** - Immediate threat (DoS, all TCP flags set)
- **WARNING (Orange)** - High suspicion (port scans, anomalies)
- **INFO (Blue)** - Notable activity (geographic anomalies)

**Packet Info:**
- Source IP - Where packet came from
- Destination IP - Where packet was going
- Protocol - TCP, UDP, or ICMP
- Port numbers - Source and destination ports
- Packet Size - Number of bytes

## Troubleshooting

**Q: No alerts appearing?**
A: Click "Start Capture" - it must be running to generate alerts.

**Q: Dashboard shows "Idle"?**
A: Status should show "Capturing" when running. If not, click "Start Capture".

**Q: Can't connect to Supabase?**
A: Check that Supabase environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Q: How is this generating packets?**
A: Uses simulated packet generator (not actual network capture). Works everywhere without admin access.

## What Makes This Real?

1. **Realistic Traffic Patterns** - Mix of normal and attack packets
2. **Real Detection Rules** - Same algorithms used in production IDSs
3. **Real Database** - Data persists in Supabase
4. **Real Alerts** - Actual threat detection with severity levels
5. **Real UI** - Live dashboard with auto-updating stats

## Next Steps

- Try adding IPs to blacklist (will trigger alerts immediately)
- Stop and start capture to see new traffic
- Refresh the page - data persists in database
- Check different severity filters
- Monitor the real-time chart

---

**That's it!** You now have a fully functional IDS monitoring network threats in real-time.
