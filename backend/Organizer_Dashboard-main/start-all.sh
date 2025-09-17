#!/bin/bash

# Start all microservices and api-gateway in new terminal windows
declare -A services=(
    ["api-gateway"]="./backend/api-gateway/src/index.js"
    ["alert-service"]="./backend/services/alert-service/src/index.js"
    ["auth-service"]="./backend/services/auth-service/src/index.js"
    ["building-service"]="./backend/services/building-service/src/index.js"
    ["event-service"]="./backend/services/event-service/src/index.js"
    ["orgMng-service"]="./backend/services/orgMng-service/src/index.js"
)

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to detect available terminal emulator
detect_terminal() {
    if command -v gnome-terminal &> /dev/null; then
        echo "gnome-terminal"
    elif command -v konsole &> /dev/null; then
        echo "konsole"
    elif command -v xterm &> /dev/null; then
        echo "xterm"
    elif command -v terminator &> /dev/null; then
        echo "terminator"
    else
        echo "none"
    fi
}

# Function to start service in new terminal window
start_service() {
    local service_name=$1
    local service_path=$2
    local terminal_type=$3
    
    echo "Starting $service_name..."
    
    case $terminal_type in
        "gnome-terminal")
            gnome-terminal --title="$service_name" -- bash -c "cd '$SCRIPT_DIR' && node '$service_path'; exec bash"
            ;;
        "konsole")
            konsole --title "$service_name" -e bash -c "cd '$SCRIPT_DIR' && node '$service_path'; exec bash" &
            ;;
        "xterm")
            xterm -title "$service_name" -e bash -c "cd '$SCRIPT_DIR' && node '$service_path'; exec bash" &
            ;;
        "terminator")
            terminator --title="$service_name" -e "bash -c 'cd \"$SCRIPT_DIR\" && node \"$service_path\"; exec bash'" &
            ;;
        *)
            echo "No supported terminal emulator found. Running $service_name in background..."
            cd "$SCRIPT_DIR"
            nohup node "$service_path" > "${service_name}.log" 2>&1 &
            echo "  → $service_name running in background (PID: $!), logs: ${service_name}.log"
            ;;
    esac
    
    # Small delay to prevent terminal windows from overlapping
    sleep 0.5
}

# Detect terminal
terminal_type=$(detect_terminal)

if [ "$terminal_type" != "none" ]; then
    echo "Using terminal emulator: $terminal_type"
    echo "Starting all services in separate terminal windows..."
else
    echo "No supported terminal emulator found. Services will run in background."
    echo "Supported terminals: gnome-terminal, konsole, xterm, terminator"
fi

# Start all services
for service_name in "${!services[@]}"; do
    service_path="${services[$service_name]}"
    
    # Check if service file exists
    if [ -f "$SCRIPT_DIR/$service_path" ]; then
        start_service "$service_name" "$service_path" "$terminal_type"
    else
        echo "⚠ Service file not found: $service_path, skipping $service_name..."
    fi
done

echo ""
echo "🎉 All services started!"

if [ "$terminal_type" != "none" ]; then
    echo "📋 Check the individual terminal windows for each service's output."
else
    echo "📋 Services are running in background. Check *.log files for output."
    echo "💡 To stop all background services, run: pkill -f 'node.*backend.*index.js'"
fi
