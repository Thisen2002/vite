# Install node modules for all microservices and api-gateway
$folders = @(
    ".\backend\api-gateway",
    ".\backend\services\alert-service",
    ".\backend\db",
    ".\backend\services\auth-service",
    ".\backend\services\building-service",
    ".\backend\services\event-service",
    ".\backend\services\orgMng-service"
)

foreach ($folder in $folders) {
    Write-Host "Installing in $folder"
    cd $folder
    npm install
    npm install dotenv
    cd $PSScriptRoot
}