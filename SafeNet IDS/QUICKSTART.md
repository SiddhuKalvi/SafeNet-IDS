# SafeNet IDS - Quick Start Guide

Get the SafeNet Network Intrusion Detection System up and running in 5 minutes!

## One-Command Setup

### On macOS/Linux:
```bash
chmod +x scripts/start_ids.sh && ./scripts/start_ids.sh
```

### On Windows (PowerShell):
```powershell
cd scripts
pip install -r requirements.txt
python init_db.py
cd ..
pnpm install
```

## Manual Setup (5 Steps)

### Step 1: Install Frontend Dependencies
```bash
pnpm install
```

### Step 2: Install Python Backend
```bash
cd scripts
pip install -r requirements.txt
python init_db.py
cd ..
```

### Step 3: Start Backend (Terminal 1)
```bash
cd scripts
python api_server.py
```

You should see:
```
Uvicorn running on http://127.0.0.1:8000
```

### Step 4: Start Frontend (Terminal 2)
```bash
pnpm dev
```

You should see:
```
▲ Next.js 16.1.6
- Local: http://localhost:3000
```

### Step 5: Open Dashboard
Open http://localhost:3000 in your browser and click "Start Capture"

## First Time Usage

1. **Dashboard Opens** → You see the Overview tab with real-time statistics
2. **Click "Start Capture"** → System begins analyzing simulated network traffic
3. **Watch Alerts** → Security alerts appear in real-time
4. **Explore Tabs** → Check Packets, Logs, Rules, and Analytics
5. **Configure Rules** → Adjust detection sensitivity in Rules tab

## What You'll See

### Overview Tab
- Real-time packet count
- Total and critical alerts
- Suspicious IP count
- Alert distribution chart

### Packets Tab
- Live network packet stream
- Protocol breakdown (TCP, UDP, ICMP)
- Source and destination IPs
- Packet sizes and flags

### Logs Tab
- Historical intrusion attempts
- Searchable by source IP
- Event types and severity levels
- Pagination for large datasets

### Rules Tab
- 6 detection rules (all configurable)
- Enable/disable rules
- Adjust thresholds
- Set severity levels

### Analytics Tab
- Alert timeline chart
- Protocol distribution pie chart
- Alert severity breakdown
- Top source and destination IPs

### IP Management Tab
- Add/remove blacklisted IPs
- Add/remove whitelisted IPs
- Track reasons and descriptions

### Settings Tab
- API URL configuration
- Auto-refresh settings
- Database retention policies
- Alert configuration
- Export settings

## Default Detection Rules

All enabled by default:

| Rule | Trigger | Severity |
|------|---------|----------|
| Port Scanning | 5+ ports in 30 seconds | HIGH |
| DoS Detection | 1000+ packets in 10 seconds | CRITICAL |
| Blacklist Check | Traffic from blacklisted IP | HIGH |
| Whitelist Check | Connection to non-whitelisted IP | MEDIUM |
| Protocol Anomalies | Unusual TCP flags or large packets | MEDIUM |
| Geographic Anomalies | Connection from unusual locations | MEDIUM |

## API Endpoints (For Testing)

```bash
# Health check
curl http://localhost:8000/health

# Get recent packets
curl http://localhost:8000/packets?limit=10

# Get alerts
curl http://localhost:8000/alerts

# Get statistics
curl http://localhost:8000/stats
```

## Troubleshooting

### Port Already in Use
**Error**: `Address already in use`

**Solution**:
```bash
# Find and kill process using port 8000
lsof -i :8000
kill -9 <PID>

# Or use different port in api_server.py
```

### Module Not Found
**Error**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
cd scripts
pip install -r requirements.txt
```

### Database Error
**Error**: `DatabaseError` or `FileNotFoundError`

**Solution**:
```bash
cd scripts
python init_db.py
```

### Frontend Won't Load
**Error**: `Connection refused` in console

**Solution**:
1. Check backend is running: `curl http://localhost:8000/health`
2. Check `.env.local` has correct API URL
3. Browser console (F12) will show exact error

## Modes of Operation

### Simulation Mode (Default)
- No elevated privileges needed
- Generates realistic simulated packets
- Perfect for testing and demos
- Auto-enabled when you click "Start Capture"

### Real Packet Capture (Advanced)
- Requires administrator/sudo access
- Captures actual network traffic
- Uncomment `use_simulation=False` in `/capture/start` call
- Run: `sudo python api_server.py`

## Next Steps

After you've tried the basic setup:

1. **Explore Detection Rules**: Adjust thresholds in Rules tab
2. **Test Blacklist**: Add IPs to blacklist via IP Management
3. **Analyze Data**: Check Analytics for patterns
4. **Export Config**: Save settings via Settings tab

## Configuration Files

- **Frontend Config**: `.env.local` (optional)
- **Backend Config**: `scripts/` directory (auto-initialized)
- **Database**: `ids_database.db` (auto-created)
- **Settings**: Browser localStorage

## Performance Tips

- Refresh interval: 5-10 seconds for balance
- Packet retention: 24 hours (default)
- Max packets in memory: 10,000 (adjustable)
- Clear old logs regularly via database settings

## Common Customizations

### Change Refresh Interval
1. Go to Settings tab
2. Toggle "Auto-Refresh Dashboard"
3. Adjust refresh interval
4. Click "Save General Settings"

### Adjust Rule Thresholds
1. Go to Rules tab
2. Click threshold value for rule
3. Adjust and update
4. Changes apply immediately

### Add Trusted IP
1. Go to IP Management tab
2. Click "Whitelist" sub-tab
3. Enter IP address
4. Click "Add"

## Getting Help

- Check the browser console (F12) for errors
- Check terminal output for backend errors
- Review [README.md](./README.md) for full documentation
- See [SETUP.md](./SETUP.md) for detailed setup guide

## Example Workflow

```
1. Open http://localhost:3000
   ↓
2. Click "Start Capture"
   ↓
3. Watch packets stream in (real-time)
   ↓
4. Observe alerts appear (when rules trigger)
   ↓
5. Check Analytics for patterns
   ↓
6. Review Logs for details
   ↓
7. Adjust Rules as needed
   ↓
8. Manage IPs via IP Management
```

## System Requirements

- Node.js 18+
- Python 3.8+
- 100MB disk space
- 2GB RAM recommended
- Administrator access (for real packet capture)

## What's Included

✅ **Complete Backend**: FastAPI with real-time packet analysis
✅ **Production Dashboard**: React 19 with real-time updates
✅ **6 Detection Rules**: Fully configurable via UI
✅ **SQL Database**: SQLite with 11 tables
✅ **API Server**: RESTful endpoints for all features
✅ **Real-time Updates**: WebSocket-ready architecture
✅ **Full Documentation**: README, SETUP, and this guide

## Need More?

- Deploy to production? See SETUP.md → Deployment
- Add custom rules? See backend code in `scripts/`
- Integrate with SIEM? See API endpoints in README.md
- Troubleshoot issues? See Troubleshooting section above

---

**Ready to detect threats?** Start with Step 1 above!
