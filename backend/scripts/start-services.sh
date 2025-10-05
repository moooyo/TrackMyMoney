#!/bin/bash

# TrackMyMoney - Start all services
# This script starts both the Market service (Python) and the API server (Go)

set -e

# Colors for output
COLOR_RESET='\033[0m'
COLOR_GREEN='\033[32m'
COLOR_YELLOW='\033[33m'
COLOR_RED='\033[31m'
COLOR_BLUE='\033[34m'
COLOR_BOLD='\033[1m'

# Project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MARKET_DIR="$BACKEND_DIR/market"

# PID file for market service
MARKET_PID_FILE="/tmp/trackmymoney-market.pid"

# Function to print colored messages
print_info() {
    echo -e "${COLOR_BLUE}${COLOR_BOLD}ℹ${COLOR_RESET} $1"
}

print_success() {
    echo -e "${COLOR_GREEN}${COLOR_BOLD}✓${COLOR_RESET} $1"
}

print_warning() {
    echo -e "${COLOR_YELLOW}${COLOR_BOLD}⚠${COLOR_RESET} $1"
}

print_error() {
    echo -e "${COLOR_RED}${COLOR_BOLD}✗${COLOR_RESET} $1"
}

# Function to cleanup market service on exit
cleanup() {
    print_info "Shutting down services..."

    if [ -f "$MARKET_PID_FILE" ]; then
        MARKET_PID=$(cat "$MARKET_PID_FILE")
        if ps -p "$MARKET_PID" > /dev/null 2>&1; then
            print_info "Stopping Market service (PID: $MARKET_PID)..."
            kill "$MARKET_PID" 2>/dev/null || true
            sleep 1
            # Force kill if still running
            if ps -p "$MARKET_PID" > /dev/null 2>&1; then
                kill -9 "$MARKET_PID" 2>/dev/null || true
            fi
            print_success "Market service stopped"
        fi
        rm -f "$MARKET_PID_FILE"
    fi

    print_success "All services stopped"
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python3 not found. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Go is installed
if ! command -v go &> /dev/null; then
    print_error "Go not found. Please install Go 1.21 or higher."
    exit 1
fi

# Check if market dependencies are installed
print_info "Checking Market service dependencies..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    print_warning "Market service dependencies not found. Installing..."
    cd "$MARKET_DIR"
    pip3 install -r requirements.txt
    print_success "Dependencies installed"
fi

# Start Market service
print_info "Starting Market service on port 5000..."
cd "$MARKET_DIR"
python3 main.py > /tmp/trackmymoney-market.log 2>&1 &
MARKET_PID=$!
echo "$MARKET_PID" > "$MARKET_PID_FILE"

# Wait a bit for market service to start
sleep 2

# Check if market service started successfully
if ! ps -p "$MARKET_PID" > /dev/null 2>&1; then
    print_error "Failed to start Market service. Check logs at /tmp/trackmymoney-market.log"
    exit 1
fi

# Check if market service is responding
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    print_success "Market service started (PID: $MARKET_PID, Port: 5000)"
else
    print_warning "Market service started but not responding yet. It may take a few more seconds..."
fi

# Start API server (Go)
print_info "Starting API server on port 8080..."
cd "$BACKEND_DIR"
go run cmd/api/main.go

# Note: The cleanup function will be called automatically when this script exits
