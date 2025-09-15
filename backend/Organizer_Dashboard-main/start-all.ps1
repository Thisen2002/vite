# Start all microservices and api-gateway in new PowerShell windows
$services = @(
    @{ Name = "api-gateway"; Path = ".\backend\api-gateway\src\index.js" },
    @{ Name = "alert-service"; Path = ".\backend\services\alert-service\src\index.js" },
    @{ Name = "auth-service"; Path = ".\backend\services\auth-service\src\index.js" },
    @{ Name = "building-service"; Path = ".\backend\services\building-service\src\index.js" },
    @{ Name = "event-service"; Path = ".\backend\services\event-service\src\index.js" },
    @{ Name = "orgMng-service"; Path = ".\backend\services\orgMng-service\src\index.js" }
)

foreach ($service in $services) {
    Start-Process powershell -ArgumentList "-NoExit", "node $($service.Path)" -WindowStyle Normal
    Write-Host "Started $($service.Name)"
}