#!/bin/bash

# SafeNet IDS - Startup Script
# This script initializes and starts the complete IDS system

set -e

echo "======================================"
echo "  SafeNet IDS - System Initialization"
echo "======================================"
echo ""

# Check Python installation
echo "✓ Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "✗ Python3 not found. Please install Python 3.8 or higher."
    exit 1
fi
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo "  Found Python $PYTHON_VERSION"
echo ""

# Install Python dependencies
echo "✓ Installing Python dependencies..."
pip install -r requirements.txt > /dev/null 2>&1
echo "  Dependencies installed"
echo ""

# Initialize database
echo "✓ Initializing database..."
python3 init_db.py
echo "  Database ready"
echo ""

# Check Node installation
echo "✓ Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Please install Node.js 18 or higher."
    exit 1
fi
NODE_VERSION=$(node --version)
echo "  Found $NODE_VERSION"
echo ""

echo "======================================"
echo "  SafeNet IDS - Ready to Start"
echo "======================================"
echo ""
echo "To start the complete system, run in separate terminals:"
echo ""
echo "  Terminal 1 (Frontend):"
echo "    pnpm dev"
echo ""
echo "  Terminal 2 (Backend):"
echo "    cd scripts"
echo "    python3 api_server.py"
echo ""
echo "Frontend: http://localhost:3000"
echo "API:      http://localhost:8000"
echo ""
echo "For real packet capture (requires sudo):"
echo "    sudo python3 api_server.py"
echo ""
