#!/bin/bash

# Install node modules for all microservices and api-gateway
folders=(
    "./backend/api-gateway"
    "./backend/services/alert-service"
    "./backend/db"
    "./backend/services/auth-service"
    "./backend/services/building-service"
    "./backend/services/event-service"
    "./backend/services/orgMng-service"
)

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for folder in "${folders[@]}"; do
    echo "Installing in $folder"
    cd "$SCRIPT_DIR/$folder"
    
    if [ -f "package.json" ]; then
        npm install
        npm install dotenv
        echo "✓ Completed $folder"
    else
        echo "⚠ No package.json found in $folder, skipping..."
    fi
    
    cd "$SCRIPT_DIR"
done

echo "🎉 All installations completed!"
