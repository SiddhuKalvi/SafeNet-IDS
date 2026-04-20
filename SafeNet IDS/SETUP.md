# SafeNet IDS - Setup Guide

A production-ready Network Intrusion Detection System (IDS) with real-time threat monitoring, comprehensive detection rules, and an interactive web dashboard.

## Architecture Overview

- **Frontend**: Next.js 16 + React 19 with TypeScript
- **Backend**: Python FastAPI with SQLite database
- **Real-time Updates**: Packet capture and analysis with WebSocket support
- **Detection Rules**: Port scanning, DoS attacks, blacklist checking, protocol anomalies, and geographic anomalies

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.8+
- Administrator/sudo access (for real packet capture)

### Frontend Setup

1. Install frontend dependencies:
```bash
pnpm install
```

2. Configure API URL (optional):
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Start the development server:
```bash
pnpm dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Install Python dependencies:
```bash
cd scripts
pip install -r requirements.txt
```

2. Initialize the database:
```bash
python init_db.py
```

3. Start the FastAPI server:
```bash
python api_server.py
```

The API will be available at `http://localhost:8000`

**Note**: For real packet capture (non-simulation mode), run with elevated privileges:
```bash
sudo python api_server.py
```

## Configuration

### Detection Rules

All detection rules are configurable via the dashboard:

1. **Port Scanning Detection**
   - Triggers when one IP accesses >5 ports in <30 seconds
   - Default severity: HIGH

2. **DoS Attack Detection**
   - Triggers when single IP sends >1000 packets in <10 seconds
   - Default severity: CRITICAL

3. **Blacklist Checking**
   - Flags traffic from blacklisted IP addresses
   - Manage via IP Management tab

4. **Whitelist Checking**
   - Flags connections to non-whitelisted IPs (if enabled)
   - Manage via IP Management tab

5. **Protocol Anomalies**
   - Detects unusual TCP flags (e.g., SYN+FIN)
   - Detects oversized packets (>65000 bytes)

6. **Geographic Anomalies**
   - Flags connections from unusual geographic locations
   - Currently flags known VPN/proxy IP ranges

### Database

The application uses SQLite with the following tables:

- `packets` - Raw captured packet data
- `alerts` - Generated security alerts
- `logs` - Historical intrusion attempts
- `blacklist` - Blacklisted IP addresses
- `whitelist` - Whitelisted IP addresses
- `detection_rules` - Configurable detection rules
- `port_scan_events` - Port scanning attack records
- `dos_events` - DoS attack records
- `protocol_anomalies` - Protocol anomaly events
- `geolocation` - Geographic location data
- `network_stats` - Network statistics snapshots

Database file: `ids_database.db`

## API Endpoints

### Packets
- `GET /packets` - Get recent packets
- `GET /packets?limit=100&offset=0` - Get packets with pagination

### Alerts
- `GET /alerts` - Get all alerts
- `GET /alerts?severity=critical` - Filter by severity

### Logs
- `GET /logs` - Get intrusion logs
- `GET /logs?event_type=port_scan&src_ip=192.168.1.1` - Filter logs

### Detection Rules
- `GET /rules` - Get all detection rules
- `POST /rules/{id}` - Update a rule

### Blacklist
- `GET /blacklist` - Get blacklisted IPs
- `POST /blacklist` - Add IP to blacklist
- `DELETE /blacklist/{ip}` - Remove from blacklist

### Whitelist
- `GET /whitelist` - Get whitelisted IPs
- `POST /whitelist` - Add IP to whitelist
- `DELETE /whitelist/{ip}` - Remove from whitelist

### Statistics
- `GET /stats` - Get network statistics and metrics

### Capture Control
- `POST /capture/start` - Start packet capture
- `POST /capture/stop` - Stop packet capture

## Dashboard Features

### Overview Tab
- Real-time statistics (packets, alerts, suspicious IPs)
- Alert by type bar chart
- Recent network packets
- Active security alerts

### Packets Tab
- Live packet stream with filtering
- Protocol, IP, and port information
- Real-time updates every 5 seconds

### Rules Tab
- Enable/disable detection rules
- Adjust thresholds and time windows
- Configure severity levels
- View rule descriptions

### IP Management Tab
- Add/remove blacklisted IPs
- Add/remove whitelisted IPs
- Track blacklist reasons
- Manage whitelist descriptions

## Packet Capture Modes

### Simulation Mode (Default)
- Generates realistic simulated packet data
- No elevated privileges required
- Perfect for testing and demonstration
- Start with "Start Capture" button on dashboard

### Real Packet Capture
- Requires elevated privileges (sudo)
- Uses Scapy to capture actual network traffic
- Set `use_simulation=false` when calling `/capture/start`

## Deployment

### Local Development
```bash
# Terminal 1: Frontend
pnpm dev

# Terminal 2: Backend
cd scripts
python api_server.py
```

### Production Deployment

1. **Docker Containerization** (Recommended)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY scripts/ /app/scripts/
RUN pip install -r scripts/requirements.txt
CMD ["python", "scripts/api_server.py"]
```

2. **Backend Server**
- Use Gunicorn or similar ASGI server
- Expose on production port (e.g., 8000)
- Configure CORS for your frontend domain

3. **Frontend Deployment**
- Build: `pnpm build`
- Deploy to Vercel, Netlify, or your hosting provider
- Set `NEXT_PUBLIC_API_URL` to your backend URL

## Security Considerations

1. **API Authentication**: Add authentication to API endpoints in production
2. **Database Encryption**: Encrypt sensitive data in the database
3. **Network Access**: Restrict API access to authorized users
4. **Packet Retention**: Configure data retention policies to manage storage
5. **Rule Validation**: Validate all rule configurations before saving
6. **Input Sanitization**: Sanitize all user inputs (already handled in code)

## Troubleshooting

### "Connection refused" error
- Ensure backend is running on the configured port
- Check `NEXT_PUBLIC_API_URL` environment variable

### "Permission denied" for packet capture
- Run with `sudo` for real packet capture
- Use simulation mode (default) if elevated privileges unavailable

### Database file not found
- Run `python init_db.py` to create database
- Check file permissions in scripts directory

### No packets appearing
- Start capture using dashboard "Start Capture" button
- Verify backend is running and database exists
- Check browser console for API errors

## Performance Notes

- Packet capture at ~100-1000 packets/sec depending on network
- Alert generation is real-time based on rule triggers
- Database auto-cleanup removes packets older than 24 hours
- Use pagination for large result sets

## Future Enhancements

- [ ] GeoIP integration for accurate geographic anomaly detection
- [ ] Machine learning-based anomaly detection
- [ ] Multi-user support with role-based access
- [ ] Real-time alerts via email/webhook
- [ ] Historical trend analysis and reporting
- [ ] Network topology visualization
- [ ] Custom rule creation interface
- [ ] Integration with SIEM platforms

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs for API errors
3. Check browser console for frontend errors
4. Verify database and file permissions
