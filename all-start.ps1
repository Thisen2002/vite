# Install node modules for all microservices and api-gateway
$folders = @(
    ".\",
    ".\backend\Maps\backend map",
    ".\backend\heatmap\backend\exhibition-map-backend",
    ".\backend\events"
)

foreach ($folder in $folders) {
    Write-Host "Installing in $folder"
    cd $folder
    npm install
    cd $PSScriptRoot
}


$folders5 = @(
    ".\backend\Organizer_Dashboard-main\backend\api-gateway",
    ".\backend\Organizer_Dashboard-main\backend\services\alert-service",
    ".\backend\Organizer_Dashboard-main\backend\db",
    ".\backend\Organizer_Dashboard-main\backend\services\auth-service",
    ".\backend\Organizer_Dashboard-main\backend\services\building-service",
    ".\backend\Organizer_Dashboard-main\backend\services\event-service",
    ".\backend\Organizer_Dashboard-main\backend\services\orgMng-service"
)

foreach ($folder in $folders5) {
    Write-Host "Installing in $folder"
    cd $folder
    npm install
    npm install dotenv
    cd $PSScriptRoot
}

# Start all microservices and api-gateway using the dedicated script
Write-Host "Starting Organizer Dashboard services..."
cd ".\backend\Organizer_Dashboard-main"
.\start-all.ps1
cd $PSScriptRoot

$folders1 = @(
    ".\",
    ".\backend\events"
)

foreach ($folder in $folders1) {
    Write-Host "Starting npm run dev in $folder"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$folder'; npm run dev" -WindowStyle Normal
}

$folders2 = @(
    ".\backend\Maps\backend map"
)

foreach ($folder in $folders2) {
    Write-Host "Starting node app.js in $folder"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$folder'; node app.js" -WindowStyle Normal
}

$folders3 = @(
    ".\backend\heatmap\backend\exhibition-map-backend"
)

foreach ($folder in $folders3) {
    Write-Host "Starting node index.js in $folder"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$folder'; node index.js" -WindowStyle Normal
}

