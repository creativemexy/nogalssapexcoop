#!/bin/bash
# Script to free port 8081 for React Native Metro bundler

echo "Checking for processes on port 8081..."

# Method 1: Using fuser (requires sudo)
if command -v fuser &> /dev/null; then
    echo "Attempting to kill process using fuser..."
    sudo fuser -k 8081/tcp 2>/dev/null && echo "Port 8081 freed!" || echo "fuser failed or requires password"
fi

# Method 2: Using lsof
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:8081 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "Found process $PID on port 8081"
        echo "Killing process $PID..."
        kill -9 $PID 2>/dev/null && echo "Port 8081 freed!" || echo "Failed to kill process (may need sudo)"
    else
        echo "No process found on port 8081"
    fi
fi

# Method 3: Using netstat/ss
if command -v ss &> /dev/null; then
    PID=$(ss -tlnp | grep :8081 | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
    if [ ! -z "$PID" ]; then
        echo "Found process $PID on port 8081"
        kill -9 $PID 2>/dev/null && echo "Port 8081 freed!" || echo "Failed to kill process (may need sudo)"
    fi
fi

echo ""
echo "If port is still in use, you can:"
echo "1. Use a different port: npm start -- --port 8082"
echo "2. Manually kill the process: kill -9 \$(lsof -ti:8081)"
echo "3. Restart your computer"

